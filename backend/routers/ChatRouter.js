import express from "express";
import {
  getAllConversation,
  getAllConversationByUser,
  getAllFriend,
  getAllMessageByConversation,
  saveMessage,
  seenMessage,
  revokeMessage,
  deleteMessage,
  forwardMessage,
  createGroupConversation,
  addMemberToGroup,
  removeMemberFromGroup,
  leaveGroup,
  updateGroupInfo,
  deleteGroup,
  setAdmin2,
  removeAdmin2,
  updateGroupPermissions
} from "../controllers/chatController.js";
import { isAuth } from "../utils/index.js";
import multer from "multer";
import { uploadToCloudinary } from "../config/Cloudinary.js";
import { emitNewMessage } from "../config/Socket.js";
import fs from "fs";
import path from "path";
import { MessageModel } from "../models/MessageModel.js";

const ChatRouter = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({ storage: storage });

ChatRouter.get("/", getAllConversation);
ChatRouter.get("/allmessage/:id", getAllMessageByConversation);
ChatRouter.get("/:id", getAllConversationByUser);
ChatRouter.get("/friend/:id", getAllFriend);

ChatRouter.post("/message", isAuth, saveMessage);
ChatRouter.post("/seen/:id", isAuth, seenMessage);
ChatRouter.post("/message/revoke/:messageId", isAuth, revokeMessage);
ChatRouter.post("/message/delete/:messageId", isAuth, deleteMessage);
ChatRouter.post("/message/forward", isAuth, forwardMessage);

// Group chat routes
ChatRouter.post("/group", isAuth, createGroupConversation);
ChatRouter.put("/group", isAuth, updateGroupInfo);
ChatRouter.delete("/group/:conversationId", isAuth, deleteGroup);
ChatRouter.post("/group/members", isAuth, addMemberToGroup);
ChatRouter.delete("/group/:conversationId/members/:memberId", isAuth, removeMemberFromGroup);
ChatRouter.post("/group/leave/:conversationId", isAuth, leaveGroup);

// Admin2 and permissions routes
ChatRouter.post("/group/admin2", isAuth, setAdmin2);
ChatRouter.delete("/group/admin2/:conversationId", isAuth, removeAdmin2);
ChatRouter.put("/group/permissions", isAuth, updateGroupPermissions);

ChatRouter.post("/upload", isAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { idConversation, sender, content, type, socketId } = req.body;
    
    if (!idConversation || !sender) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Log socketId if present
    if (socketId) {
      console.log(`📱 Received socketId in request: ${socketId}`);
    }

    // Log file details
    console.log('📝 Received file:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    // Upload to Cloudinary - ensure this is awaited properly
    const filePath = req.file.path;
    let result;
    try {
      result = await uploadToCloudinary(filePath);
      if (!result || !result.secure_url) {
        throw new Error("Cloudinary upload failed or returned invalid result");
      }
      
      console.log('☁️ Cloudinary upload successful:', {
        url: result.secure_url,
        public_id: result.public_id,
        resource_type: result.resource_type
      });
    } catch (cloudinaryError) {
      console.error("Cloudinary upload error:", cloudinaryError);
      // Clean up the local file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(500).json({ error: "Failed to upload to cloud storage" });
    }

    // Determine more specific file type
    let messageType = 'file';
    if (req.file.mimetype.startsWith('image/')) {
      messageType = 'image';
    } else if (req.file.mimetype.startsWith('video/')) {
      messageType = 'video';
    } else if (req.file.mimetype.startsWith('audio/')) {
      messageType = 'audio';
    } else if (req.file.mimetype.includes('pdf')) {
      messageType = 'pdf';
    } else if (req.file.mimetype.includes('word') || 
               req.file.mimetype.includes('document') || 
               req.file.originalname.endsWith('.doc') || 
               req.file.originalname.endsWith('.docx')) {
      messageType = 'doc';
    } else if (req.file.mimetype.includes('excel') || 
               req.file.mimetype.includes('sheet') || 
               req.file.originalname.endsWith('.xls') || 
               req.file.originalname.endsWith('.xlsx')) {
      messageType = 'excel';
    } else if (req.file.mimetype.includes('presentation') || 
               req.file.originalname.endsWith('.ppt') || 
               req.file.originalname.endsWith('.pptx')) {
      messageType = 'presentation';
    }
    
    const messageData = {
      idConversation,
      seen: false,
      sender,
      fileUrl: result.secure_url,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      type: messageType
    };
    
    // Add content based on message type
    if (content && content.trim() !== '') {
      // User entered caption
      messageData.content = content;
    } else if (messageType !== 'image') {
      // For non-image files, display file name
      messageData.content = `File: ${req.file.originalname}`;
    } else {
      // For images without caption, leave content empty
      messageData.content = '';
    }
    
    console.log('💾 Saving message with data:', JSON.stringify(messageData, null, 2));
    
    const mockReq = {
      body: messageData,
      user: { _id: sender }
    };
    
    // Save message to database
    const savedMessage = await saveMessage(mockReq);
    
    if (savedMessage) {
      // Clean up temporary file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Get the complete message with all fields
      const populatedMessage = {
        ...savedMessage.toObject(),
        _id: savedMessage._id.toString(),      // Ensure _id is a string for consistent comparisons
        type: messageType,                     // Ensure type is correctly set
        fileUrl: result.secure_url,            // Ensure fileUrl is correctly set
        fileName: req.file.originalname,       // Ensure fileName is set
        fileType: req.file.mimetype            // Ensure fileType is set
      };
      
      console.log('📤 Sending file message with complete data:', populatedMessage);
      
      // Send new message through socket for real-time
      await emitNewMessage(populatedMessage, socketId);
      
      // Send response to client
      res.status(201).json(populatedMessage);
    } else {
      // Clean up if message save failed
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      res.status(500).json({ error: "Failed to save message" });
    }
  } catch (error) {
    console.error("Error processing file upload:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to upload file: " + error.message });
    }
  }
});

// API thêm cảm xúc vào tin nhắn
ChatRouter.post("/message/reaction", isAuth, async (req, res) => {
  try {
    const { messageId, userId, emoji } = req.body;
    
    if (!messageId || !userId || !emoji) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Tìm tin nhắn
    const message = await MessageModel.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    
    // Khởi tạo reactions object nếu chưa có
    if (!message.reactions) {
      message.reactions = {};
    }
    
    // Khởi tạo mảng người dùng cho emoji này nếu chưa có
    if (!message.reactions[emoji]) {
      message.reactions[emoji] = [];
    }
    
    // Thêm userId vào danh sách nếu chưa có
    if (!message.reactions[emoji].includes(userId)) {
      message.reactions[emoji].push(userId);
      await message.save();
      
      console.log(`👍 Người dùng ${userId} đã thêm cảm xúc ${emoji} vào tin nhắn ${messageId}`);
    }
    
    res.status(200).json({ message: "Reaction added successfully" });
  } catch (error) {
    console.error("Error adding reaction:", error);
    res.status(500).json({ error: "Failed to add reaction" });
  }
});

// API xóa cảm xúc khỏi tin nhắn
ChatRouter.post("/message/reaction/remove", isAuth, async (req, res) => {
  try {
    const { messageId, userId, emoji } = req.body;
    
    if (!messageId || !userId || !emoji) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Tìm tin nhắn
    const message = await MessageModel.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    
    // Kiểm tra xem có reactions không
    if (message.reactions && message.reactions[emoji]) {
      // Xóa userId khỏi danh sách
      message.reactions[emoji] = message.reactions[emoji].filter(id => id.toString() !== userId);
      
      // Nếu không còn ai thả emoji này, xóa khỏi danh sách
      if (message.reactions[emoji].length === 0) {
        delete message.reactions[emoji];
      }
      
      await message.save();
      console.log(`👎 Người dùng ${userId} đã xóa cảm xúc ${emoji} khỏi tin nhắn ${messageId}`);
    }
    
    res.status(200).json({ message: "Reaction removed successfully" });
  } catch (error) {
    console.error("Error removing reaction:", error);
    res.status(500).json({ error: "Failed to remove reaction" });
  }
});

export default ChatRouter;
