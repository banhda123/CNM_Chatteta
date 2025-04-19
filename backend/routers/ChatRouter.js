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

    // Ghi log socketId nếu có
    if (socketId) {
      console.log(`📱 Nhận được socketId trong request: ${socketId}`);
    }

    const filePath = req.file.path;
    const result = await uploadToCloudinary(filePath);
    
    const messageData = {
      idConversation,
      content: content || `File: ${req.file.originalname}`,
      type: type || 'file',
      seen: false,
      sender,
      fileUrl: result.secure_url,
      fileName: req.file.originalname,
      fileType: req.file.mimetype
    };
    
    const mockReq = {
      body: messageData,
      user: { _id: sender }
    };
    
    const savedMessage = await saveMessage(mockReq, res);
    
    if (!res.headersSent) {
      fs.unlinkSync(filePath);
      
      // Gửi tin nhắn mới qua socket để real-time
      console.log('📱 Gửi tin nhắn ảnh qua socket:', savedMessage._id);
      await emitNewMessage(savedMessage, socketId);
      
      res.status(201).json(savedMessage);
    } else {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to upload file: " + error.message });
    }
  }
});

ChatRouter.post("/message/revoke/:messageId", isAuth, revokeMessage);
ChatRouter.post("/message/delete/:messageId", isAuth, deleteMessage);

export default ChatRouter;
