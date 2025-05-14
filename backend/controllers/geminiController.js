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
    // Support both formats: messageId/conversationId or direct content/conversationId
    const { messageId, conversationId, content } = req.body;
    
    // Validate input
    if (!content && !messageId) {
      return res.status(400).json({ error: 'Either messageId or content must be provided' });
    }
    
    let messageContent;
    let conversation = null;
    let geminiUser = null;
    
    // Get message content
    if (messageId) {
      // Original flow - find message by ID
      const userMessage = await MessageModel.findById(messageId);
      if (!userMessage) {
        return res.status(404).json({ error: 'Message not found' });
      }
      messageContent = userMessage.content;
    } else if (content) {
      // New flow - direct content provided
      messageContent = content;
    }
    
    // Try to find conversation and Gemini user if conversationId is provided
    if (conversationId && conversationId !== 'temp-conversation') {
      try {
        conversation = await ConversationModel.findById(conversationId)
          .populate('members.idUser');
        
        if (conversation) {
          geminiUser = conversation.members.find(member => member.idUser.isAI)?.idUser;
        }
      } catch (error) {
        console.warn('Could not find conversation:', error.message);
        // Continue without conversation - we'll return direct response
      }
    }
    
    // Generate Gemini response regardless of conversation
    const geminiResponse = await fetchGeminiResponse(messageContent);
    
    // If we have a valid conversation and Gemini user, save the message
    if (conversation && geminiUser) {
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
    } else {
      // Direct response without saving to database
      return res.status(200).json({
        success: true,
        message: 'Gemini response generated',
        data: {
          content: geminiResponse,
          createdAt: new Date()
        }
      });
    }
    
  } catch (error) {
    console.error('Error processing Gemini message:', error);
    return res.status(500).json({ error: 'Failed to process Gemini message' });
  }
};
