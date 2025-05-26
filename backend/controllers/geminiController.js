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
    const { messageId, conversationId, content, sender } = req.body;
    
    // Validate input
    if (!content && !messageId) {
      return res.status(400).json({ error: 'Either messageId or content must be provided' });
    }
    
    if (!conversationId) {
      return res.status(400).json({ error: 'conversationId is required' });
    }
    
    let messageContent;
    let conversation = null;
    let geminiUser = null;
    let userSender = null;
    
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
    
    // Extract query from message if it starts with @AIGemini or @AiGemini
    let query = messageContent;
    const aiPrefixes = ['@AIGemini', '@AiGemini'];
    for (const prefix of aiPrefixes) {
      if (messageContent.trim().startsWith(prefix)) {
        query = messageContent.substring(prefix.length).trim();
        break;
      }
    }
    
    // Try to find conversation and Gemini user
    try {
      conversation = await ConversationModel.findById(conversationId)
        .populate('members.idUser');
      
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      
      // Tìm Gemini user trong cuộc trò chuyện
      geminiUser = conversation.members.find(member => 
        member.idUser && member.idUser.isAI
      )?.idUser;
      
      // Nếu không tìm thấy Gemini user, tạo một user mới
      if (!geminiUser) {
        // Tìm Gemini user trong database
        geminiUser = await UsersModel.findOne({ isAI: true });
        
        if (!geminiUser) {
          // Tạo một Gemini user mới
          geminiUser = new UsersModel({
            name: 'Gemini AI',
            email: 'gemini@ai.assistant',
            phone: 'gemini-ai',
            password: 'gemini_secure_password_' + Date.now(),
            avatar: 'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/gemini_1.width-1000.format-webp.webp',
            status: 'online',
            about: 'Tôi là trợ lý AI Gemini, luôn sẵn sàng giúp đỡ bạn!',
            isAI: true
          });
          
          await geminiUser.save();
          console.log('Created new Gemini AI user');
        }
        
        // Thêm Gemini user vào cuộc trò chuyện
        conversation.members.push({
          idUser: geminiUser._id,
          role: 'member'
        });
        
        await conversation.save();
        console.log('Added Gemini AI to conversation');
      }
      
      // Lấy thông tin người gửi
      if (sender) {
        userSender = await UsersModel.findById(sender);
      }
      
    } catch (error) {
      console.error('Error finding conversation or Gemini user:', error);
      return res.status(500).json({ error: 'Failed to process conversation data' });
    }
    
    // Generate Gemini response
    const geminiResponse = await fetchGeminiResponse(query);
    
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
    
    // Update conversation's last message with the ID of the new message
    // Theo schema, lastMessage là một ObjectId tham chiếu đến Message model
    try {
      conversation.lastMessage = newMessage._id;
      await conversation.save();
    } catch (error) {
      console.error('Error saving conversation:', error);
      // Tiếp tục xử lý mà không throw lỗi
    }
    
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
