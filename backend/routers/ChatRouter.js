import express from "express";
import {
  getAllConversation,
  getAllConversationByUser,
  getAllFriend,
  getAllMessageByConversation,
  saveMessage,
  seenMessage,
  revokeMessage,
  deleteMessage
} from "../controllers/chatController.js";
import { isAuth } from "../utils/index.js";
import multer from "multer";
import { uploadToCloudinary } from "../config/Cloudinary.js";
import { emitNewMessage } from "../config/Socket.js";
import fs from "fs";
import path from "path";

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

    // Upload to Cloudinary - ensure this is awaited properly
    const filePath = req.file.path;
    let result;
    try {
      result = await uploadToCloudinary(filePath);
      if (!result || !result.secure_url) {
        throw new Error("Cloudinary upload failed or returned invalid result");
      }
    } catch (cloudinaryError) {
      console.error("Cloudinary upload error:", cloudinaryError);
      // Clean up the local file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(500).json({ error: "Failed to upload to cloud storage" });
    }

    // Determine correct file type based on mimetype
    let messageType = type || 'file';
    if (req.file.mimetype.startsWith('image/')) {
      messageType = 'image';
    } else if (req.file.mimetype.startsWith('video/')) {
      messageType = 'video';
    } else if (req.file.mimetype.startsWith('audio/')) {
      messageType = 'audio';
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
    
    // Chỉ thêm content nếu người dùng nhập caption hoặc không phải là ảnh
    if (content && content.trim() !== '') {
      // Người dùng nhập caption
      messageData.content = content;
    } else if (messageType !== 'image') {
      // Với file không phải ảnh, cần hiển thị tên file
      messageData.content = `File: ${req.file.originalname}`;
    } else {
      // Với ảnh mà không có caption, để trống content
      messageData.content = '';
    }
    
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
      
      // Populate the message object if needed
      const populatedMessage = {
        ...savedMessage.toObject(),
        type: messageType, // Ensure type is correctly set
        fileUrl: result.secure_url, // Ensure fileUrl is correctly set
      };
      
      // Send new message through socket for real-time
      console.log('📱 Sending image message via socket:', savedMessage._id);
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

ChatRouter.post("/message/revoke/:messageId", isAuth, revokeMessage);
ChatRouter.post("/message/delete/:messageId", isAuth, deleteMessage);

export default ChatRouter;
