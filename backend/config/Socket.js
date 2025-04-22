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
import { ConversationModel } from "../models/ConversationModel.js";

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
      try {
        const newMessage = await saveMessage(data);
        
        // Kiểm tra nếu tin nhắn không được lưu thành công
        if (!newMessage) {
          console.error("Failed to save message");
          return;
        }
        
        await updateLastMesssage({
          idConversation: newMessage.idConversation,
          message: newMessage._id,
        });

        // Emit to the conversation room for real-time chat updates
        io.to(newMessage.idConversation.toString()).emit(
          "new_message",
          newMessage
        );
        
        // Ghi log thêm thông tin về loại tin nhắn đã gửi
        console.log(`📨 Tin nhắn mới đã được gửi - ID: ${newMessage._id}, Loại: ${newMessage.type}`);
        
        // Get the updated conversation with populated data
        const conversation = await ConversationModel.findById(newMessage.idConversation)
          .populate({
            path: "members.idUser",
            select: { name: 1, avatar: 1 }
          })
          .populate("lastMessage");
          
        if (conversation && conversation.members) {
          console.log(`📣 Cập nhật danh sách cuộc trò chuyện cho ${conversation.members.length} thành viên`);
          
          // Emit update_conversation_list to each member to move the conversation to the top
          conversation.members.forEach(member => {
            if (member.idUser && member.idUser._id) {
              console.log(`👤 Gửi cập nhật cho user: ${member.idUser._id}`);
              io.to(member.idUser._id.toString()).emit("update_conversation_list", {
                conversation: conversation,
                newMessage: newMessage
              });
            }
          });
        }
      } catch (error) {
        console.error("Error handling send_message:", error);
      }
    });

    socket.on("revoke_message", async (data) => {
      try {
        const { messageId, conversationId, userId } = data;
        
        // Tìm tin nhắn
        const message = await MessageModel.findById(messageId);
        
        if (!message) {
          socket.emit("revoke_message_error", { error: "Không tìm thấy tin nhắn" });
          return;
        }
        
        // Kiểm tra người thu hồi tin nhắn có phải là người gửi không
        if (message.sender.toString() !== userId) {
          socket.emit("revoke_message_error", { error: "Bạn chỉ có thể thu hồi tin nhắn của chính mình" });
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
        socket.emit("revoke_message_error", { error: "Không thể thu hồi tin nhắn" });
      }
    });
    
    socket.on("delete_message", async (data) => {
      try {
        const { messageId, conversationId, userId } = data;
        
        // Tìm tin nhắn
        const message = await MessageModel.findById(messageId);
        
        if (!message) {
          socket.emit("delete_message_error", { error: "Không tìm thấy tin nhắn" });
          return;
        }
        
        // Không cần kiểm tra người xóa có phải người gửi không
        // Kiểm tra xem người dùng đã xóa tin nhắn này chưa
        if (message.deletedBy && message.deletedBy.some(id => id.toString() === userId)) {
          socket.emit("delete_message_error", { error: "Tin nhắn đã được bạn xóa trước đó" });
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
        socket.emit("delete_message_error", { error: "Không thể xóa tin nhắn" });
      }
    });

    socket.on("create_conversation", async (data) => {
      try {
        const { userFrom, userTo } = data;
        const newConversation = await createConversation(userFrom, userTo);
        io.to(userFrom).to(userTo).emit("new_conversation", newConversation);
      } catch (error) {
        console.error("Error creating conversation:", error);
        socket.emit("conversation_error", { message: "Không thể tạo cuộc trò chuyện" });
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

    // Xử lý thêm cảm xúc vào tin nhắn
    socket.on("add_reaction", async (data) => {
      try {
        const { messageId, conversationId, userId, emoji } = data;
        
        // Tìm tin nhắn
        const message = await MessageModel.findById(messageId);
        
        if (!message) {
          socket.emit("reaction_error", { error: "Không tìm thấy tin nhắn" });
          return;
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
        
        // Gửi thông báo cho tất cả người dùng trong cuộc trò chuyện
        io.to(conversationId).emit("message_reaction", { 
          messageId, 
          emoji,
          userId,
          action: 'add'
        });
      } catch (error) {
        console.error("Error adding reaction:", error);
        socket.emit("reaction_error", { error: "Không thể thêm cảm xúc" });
      }
    });
    
    // Xử lý xóa cảm xúc khỏi tin nhắn
    socket.on("remove_reaction", async (data) => {
      try {
        const { messageId, conversationId, userId, emoji } = data;
        
        // Tìm tin nhắn
        const message = await MessageModel.findById(messageId);
        
        if (!message) {
          socket.emit("reaction_error", { error: "Không tìm thấy tin nhắn" });
          return;
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
        
        // Gửi thông báo cho tất cả người dùng trong cuộc trò chuyện
        io.to(conversationId).emit("message_reaction", { 
          messageId, 
          emoji,
          userId,
          action: 'remove'
        });
      } catch (error) {
        console.error("Error removing reaction:", error);
        socket.emit("reaction_error", { error: "Không thể xóa cảm xúc" });
      }
    });

    // Xử lý chuyển tiếp tin nhắn
    socket.on("forward_message", async (data) => {
      try {
        const { messageId, conversationId, userId } = data;
        
        // Tìm tin nhắn gốc và populate thông tin người gửi
        const originalMessage = await MessageModel.findById(messageId).populate('sender', 'name avatar');
        
        if (!originalMessage) {
          socket.emit("forward_message_error", { error: "Không tìm thấy tin nhắn" });
          return;
        }

        // Tạo tin nhắn mới với nội dung được chuyển tiếp
        const forwardedMessage = new MessageModel({
          idConversation: conversationId,
          content: originalMessage.content,
          type: originalMessage.type,
          seen: false,
          sender: userId,
          fileUrl: originalMessage.fileUrl,
          fileName: originalMessage.fileName,
          fileType: originalMessage.fileType,
          isForwarded: true,
          originalMessage: originalMessage._id,
          forwardedBy: userId,
          originalSender: originalMessage.sender._id,
          originalSenderName: originalMessage.sender.name,
          originalSenderAvatar: originalMessage.sender.avatar
        });

        const savedMessage = await forwardedMessage.save();
        
        // Cập nhật tin nhắn cuối cùng cho cuộc trò chuyện
        await updateLastMesssage({ 
          idConversation: conversationId, 
          message: savedMessage._id 
        });

        // Populate thông tin người gửi để trả về đầy đủ thông tin
        const populatedMessage = await MessageModel.findById(savedMessage._id)
          .populate('sender', 'name avatar')
          .populate('originalSender', 'name avatar');

        // CHỈ gửi tin nhắn tới phòng cuộc trò chuyện đích
        io.to(conversationId).emit("new_message", populatedMessage);
        
        // Thông báo thành công cho người gửi - chỉ gửi cho client gọi socket
        socket.emit("forward_message_success", populatedMessage);
        
      } catch (error) {
        console.error("Error forwarding message:", error);
        socket.emit("forward_message_error", { error: "Không thể chuyển tiếp tin nhắn" });
      }
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
