import { Server } from "socket.io";
import {
  createConversation,
  joinConversation,
  saveMessage,
  seenMessage,
  updateLastMesssage,
} from "../controllers/chatController.js";
import {
  acceptFriend,
  addFriend,
  deleteRequestFriend,
  DontAcceptFriend,
  unFriend,
} from "../controllers/UserController.js";
import { MessageModel } from "../models/MessageModel.js";

// Biến để lưu trữ io instance để có thể sử dụng từ các module khác
let ioInstance = null;

export const ConnectSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost", "http://localhost:8081"],
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["my-custom-header", "Content-Type", "Authorization"],
      credentials: true,
    },
  });
  
  // Lưu io instance để có thể sử dụng từ bên ngoài
  ioInstance = io;

  io.on("connection", (socket) => {
    console.log(`${socket.id} connected`);

    socket.on("join_room", (User) => {
      console.log("join-room");
      socket.join(User._id);
    });

    socket.on("leave_room", (User) => {
      console.log("leave-room");
      socket.leave(User._id);
    });

    socket.on("add_friend", async (data) => {
      const { userFrom, userTo } = data;
      await addFriend(userFrom, userTo);

      io.emit("add_friend_success");
      io.to(userTo).emit("new_request_friend", userTo);
    });

    socket.on("delete_request_friend", async (data) => {
      const { userFrom, userTo } = data;
      await deleteRequestFriend(userFrom, userTo);
      io.emit("delete_request_friend_success");
      io.to(userTo).emit("person_delete_request_friend", userTo);
    });

    socket.on("accept_request_friend", async (data) => {
      const { userFrom, userTo } = data;
      await acceptFriend(userFrom, userTo);

      io.emit("accept_request_friend_success", userFrom);
      io.to(userTo).emit("accept_request_friend", userTo);
    });

    socket.on("dont_accept_request_friend", async (data) => {
      const { userFrom, userTo } = data;
      await DontAcceptFriend(userFrom, userTo);

      io.emit("dont_accept_request_friend_success", userFrom);
      io.to(userTo).emit("dont_accept_request_friend", userTo);
    });

    socket.on("un_friend", async (data) => {
      const { userFrom, userTo, idConversation } = data;
      await unFriend(userFrom, userTo, idConversation);

      io.emit("un_friend_success", userFrom);
      io.to(userTo).emit("un_friend", userTo);
    });

    socket.on("join_conversation", (idConversation) => {
      socket.join(idConversation);
    });

    socket.on("join_all_conversation", (array) => {
      socket.join(array);
    });

    socket.on("seen_message", async (idConversation) => {
      await seenMessage(idConversation);
      io.to(idConversation).emit("seen_message");
    });

    socket.on("send_message", async (data) => {
      const newMessage = await saveMessage(data);
      await updateLastMesssage({
        idConversation: newMessage.idConversation,
        message: newMessage._id,
      });

      io.to(newMessage.idConversation.toString()).emit(
        "new_message",
        newMessage
      );
    });

    socket.on("revoke_message", async (data) => {
      try {
        const { messageId, conversationId, userId } = data;
        
        // Tìm tin nhắn
        const message = await MessageModel.findById(messageId);
        
        if (!message) {
          socket.emit("revoke_message_error", { error: "Message not found" });
          return;
        }
        
        // Kiểm tra người thu hồi tin nhắn có phải là người gửi không
        if (message.sender.toString() !== userId) {
          socket.emit("revoke_message_error", { error: "You can only revoke your own messages" });
          return;
        }
        
        // Lưu thông tin loại tin nhắn trước khi cập nhật
        const messageType = message.type || 'text';
        const hasFile = !!message.fileUrl;
        console.log(`📝 Thu hồi tin nhắn ID ${messageId}, loại: ${messageType}, có file: ${hasFile}`);
        
        // Cập nhật tình trạng thu hồi tin nhắn
        message.isRevoked = true;
        await message.save();
        
        // Thông báo cho tất cả người dùng trong cuộc trò chuyện
        io.to(conversationId).emit("message_revoked", { 
          messageId, 
          conversationId,
          type: messageType, // Gửi đúng loại tin nhắn cho client
          hasFile: hasFile // Thêm thông tin có phải là file hay không
        });
      } catch (error) {
        console.error("Error revoking message via socket:", error);
        socket.emit("revoke_message_error", { error: "Failed to revoke message" });
      }
    });
    
    socket.on("delete_message", async (data) => {
      try {
        const { messageId, conversationId, userId } = data;
        
        // Tìm tin nhắn
        const message = await MessageModel.findById(messageId);
        
        if (!message) {
          socket.emit("delete_message_error", { error: "Message not found" });
          return;
        }
        
        // Không cần kiểm tra người xóa có phải người gửi không
        // Kiểm tra xem người dùng đã xóa tin nhắn này chưa
        if (message.deletedBy && message.deletedBy.some(id => id.toString() === userId)) {
          socket.emit("delete_message_error", { error: "Message already deleted by you" });
          return;
        }
        
        // Thêm userId vào mảng deletedBy
        if (!message.deletedBy) {
          message.deletedBy = [];
        }
        
        message.deletedBy.push(userId);
        await message.save();
        
        // Chỉ gửi thông báo cho người dùng đang thực hiện thao tác
        // không phát sóng cho tất cả mọi người trong cuộc trò chuyện
        socket.emit("message_deleted", { messageId, conversationId, forUser: userId });
      } catch (error) {
        console.error("Error deleting message via socket:", error);
        socket.emit("delete_message_error", { error: "Failed to delete message" });
      }
    });

    socket.on("create_conversation", async (data) => {
      try {
        const { userFrom, userTo } = data;
        const newConversation = await createConversation(userFrom, userTo);
        io.to(userFrom).to(userTo).emit("new_conversation", newConversation);
      } catch (error) {
        console.error("Error creating conversation:", error);
        socket.emit("conversation_error", { message: "Failed to create conversation" });
      }
    });

    socket.on("leave_conversation", (idConversation) => {
      socket.leave(idConversation);
      io.to(idConversation).emit("user_left", socket.id);
    });

    socket.on("typing", (data) => {
      const { idConversation, userId } = data;
      socket.to(idConversation).emit("user_typing", userId);
    });

    socket.on("stop_typing", (data) => {
      const { idConversation, userId } = data;
      socket.to(idConversation).emit("user_stop_typing", userId);
    });

    socket.on("disconnect", () => {
      console.log(`${socket.id} disconnected`);
    });
  });
};

// Hàm tiện ích để gửi tin nhắn mới đến các client trong cuộc trò chuyện
export const emitNewMessage = async (message, socketId = null) => {
  if (ioInstance && message && message.idConversation) {
    console.log(`🔔 Emitting new message to conversation ${message.idConversation}`);
    
    // Ensure message is in the right format
    let formattedMessage = message;
    
    // If message is a Mongoose document, convert to plain object
    if (message.toObject && typeof message.toObject === 'function') {
      formattedMessage = message.toObject();
    }
    
    // Log detailed info for file messages
    if (formattedMessage.type !== 'text') {
      console.log(`📨 Emitting ${formattedMessage.type} message:`, {
        id: formattedMessage._id,
        type: formattedMessage.type,
        fileUrl: formattedMessage.fileUrl,
        fileName: formattedMessage.fileName,
        fileType: formattedMessage.fileType,
        content: formattedMessage.content
      });
      
      // Đảm bảo các thuộc tính file được giữ lại
      if (!formattedMessage.fileUrl) {
        console.warn('⚠️ Message is missing fileUrl! This will cause rendering issues.');
      }
      if (!formattedMessage.fileName && (formattedMessage.type !== 'text' && formattedMessage.type !== 'image')) {
        console.warn('⚠️ Non-text/image message is missing fileName! This will cause rendering issues.');
      }
    }
    
    // If a specific socketId is provided, emit to all clients in the conversation except the sender
    if (socketId) {
      console.log(`📲 Detected socketId: ${socketId}, direct emit`);
      ioInstance.to(formattedMessage.idConversation.toString()).except(socketId).emit('new_message', formattedMessage);
    } else {
      // Otherwise, emit to all clients in the conversation
      ioInstance.to(formattedMessage.idConversation.toString()).emit('new_message', formattedMessage);
    }
    return true;
  }
  return false;
};

// Xuất ioInstance để các module khác có thể sử dụng
export const getIO = () => ioInstance;
