import axios from 'axios';
import { MessageModel } from '../models/MessageModel.js';
import { ConversationModel } from '../models/ConversationModel.js';
import { UsersModel } from '../models/UserModel.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

const buildRequestBody = (message) => ({
  contents: [
    {
      parts: [
        {
          text: message,
        },
      ],
    },
  ],
});

const extractResponseContent = (data) => {
  const candidates = data?.candidates || [];
  if (candidates.length > 0) {
    const content = candidates[0]?.content;
    if (content?.parts?.length > 0) {
      return content.parts[0].text.trim();
    }
  }
  return "Không tìm thấy phản hồi.";
};

const handleError = (error) => {
  console.error("Error fetching Gemini response:", error?.response?.data || error);
  return "Có lỗi xảy ra, vui lòng thử lại.";
};

const fetchGeminiResponse = async (message) => {
  try {
    const response = await axios.post(GEMINI_ENDPOINT, buildRequestBody(message), {
      headers: { "Content-Type": "application/json" },
    });

    return extractResponseContent(response.data);
  } catch (error) {
    return handleError(error);
  }
};

// Process a message sent to Gemini AI and generate a response
export const processGeminiMessage = async (req, res) => {
  try {
    const { messageId, conversationId } = req.body;
    
    if (!messageId || !conversationId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Find the original message
    const userMessage = await MessageModel.findById(messageId);
    if (!userMessage) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Find the conversation
    const conversation = await ConversationModel.findById(conversationId)
      .populate('members.idUser');
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    // Find Gemini user
    const geminiUser = conversation.members.find(member => member.idUser.isAI)?.idUser;
    if (!geminiUser) {
      return res.status(404).json({ error: 'Gemini AI user not found in this conversation' });
    }
    
    // Get message content
    const messageContent = userMessage.content;
    
    // Generate Gemini response
    const geminiResponse = await fetchGeminiResponse(messageContent);
    
    // Create a new message from Gemini
    const newMessage = new MessageModel({
      idConversation: conversationId,
      sender: geminiUser._id,
      content: geminiResponse,
      type: 'text',
      status: 'sent'
    });
    
    // Save the message
    await newMessage.save();
    
    // Update conversation's last message
    conversation.lastMessage = {
      sender: geminiUser._id,
      content: geminiResponse,
      createdAt: new Date()
    };
    
    await conversation.save();
    
    // Emit socket event for new message if socket service is available
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(conversationId).emit('new_message', {
        ...newMessage.toObject(),
        sender: geminiUser
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Gemini response processed successfully',
      data: newMessage
    });
    
  } catch (error) {
    console.error('Error processing Gemini message:', error);
    return res.status(500).json({ error: 'Failed to process Gemini message' });
  }
};
