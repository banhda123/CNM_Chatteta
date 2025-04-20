import { ConversationModel } from "../models/ConversationModel.js";
import { MessageModel } from "../models/MessageModel.js";

export const createConversation = async (userFrom, userTo) => {
  console.log(userFrom, userTo);
  const newConversation = new ConversationModel({
    type: "single",
    lastMessage: "",
    members: [],
  });
  newConversation.members.push({ idUser: userFrom });
  newConversation.members.push({ idUser: userTo });
  await newConversation.save();
  return newConversation;
};

export const joinConversation = async (id) => {
  try {
    const conversation = await ConversationModel.findOne({ _id: id });
    return conversation;
  } catch (error) {
    return undefined;
  }
};

export const getAllConversation = async (req, res) => {
  const allConversation = await ConversationModel.find();
  res.send(allConversation);
};

export const getAllConversationByUser = async (req, res) => {
  try {
    const list = await ConversationModel.find({
      "members.idUser": { $in: req.params.id },
    })
      .populate({
        path: "members.idUser",
        select: { name: 1, avatar: 1 },
      })
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.send(list);
  } catch (error) {
    console.log(error);
  }
};

export const saveMessage = async (dataOrReq, res) => {
  try {
    let data;
    let userId;

    // Check if this is a direct call from socket or an HTTP request
    if (dataOrReq && dataOrReq.body) {
      // HTTP request
      data = dataOrReq.body;
      userId = dataOrReq.user?._id;
      
      if (!userId && dataOrReq.body.sender) {
        userId = dataOrReq.body.sender;
      }
    } else {
      // Direct call from socket or direct object
      data = dataOrReq;
      userId = data.sender;
    }

    if (!data || !userId) {
      console.error("Invalid data or missing user ID");
      if (res) {
        return res.status(400).send({ message: "Dữ liệu không hợp lệ" });
      }
      return null;
    }

    const { idConversation, content, type, fileUrl, fileName, fileType } = data;

    if (!idConversation) {
      console.error("Missing required field: idConversation");
      if (res) {
        return res.status(400).send({ message: "Thiếu ID cuộc trò chuyện" });
      }
      return null;
    }

    // Kiểm tra xem nội dung có phải là tin nhắn file mà không có content không
    const messageContent = content || (fileName ? `File: ${fileName}` : '');

    // Log thông tin file nhận được
    if (fileUrl || fileName || fileType) {
      console.log("📁 Saving file message:", {
        type,
        fileUrl,
        fileName,
        fileType,
        content: messageContent
      });
    }

    const messageData = {
      idConversation,
      content: messageContent,
      type: type || 'text',
      seen: false,
      sender: userId,
    };

    // Add file information if it exists
    if (fileUrl) {
      messageData.fileUrl = fileUrl;
      console.log("📄 Setting fileUrl:", fileUrl);
    }
    if (fileName) {
      messageData.fileName = fileName;
      console.log("📝 Setting fileName:", fileName);
    }
    if (fileType) {
      messageData.fileType = fileType;
      console.log("📊 Setting fileType:", fileType);
    }

    // Log để kiểm tra dữ liệu trước khi lưu
    console.log("💾 Saving message with data:", JSON.stringify(messageData, null, 2));

    const message = new MessageModel(messageData);
    const savedMessage = await message.save();

    // Log sau khi lưu để kiểm tra
    console.log("✅ Saved message:", {
      id: savedMessage._id,
      type: savedMessage.type,
      fileUrl: savedMessage.fileUrl,
      fileName: savedMessage.fileName
    });

    // Cập nhật tin nhắn cuối cùng
    await updateLastMesssage({ idConversation, message: savedMessage._id });

    // Return the message object
    if (res) {
      res.send(savedMessage);
    }
    
    return savedMessage;
  } catch (error) {
    console.error("saveMessage error:", error);
    if (res) {
      res.status(500).send({ message: "Lỗi server" });
    }
    return null;
  }
};

export const updateLastMesssage = async ({ idConversation, message }) => {
  console.log(idConversation, message);
  const conversation = await ConversationModel.findById(idConversation);
  conversation.lastMessage = message;
  await conversation.save();
};

export const getAllMessageByConversation = async (req, res) => {
  const allMessage = await MessageModel.find({ idConversation: req.params.id });
  console.log(allMessage);
  res.send(allMessage);
};

export const chat = async (id) => {
  let allConversation = await ConversationModel.findOne({ _id: id });
  res.send(allConversation);
};

export const getAllFriend = async (req, res) => {
  console.log(req.params.id);
  const data = await ConversationModel.aggregate({
    $match: { _id: req.params.id },
  });

  res.send(data);
};

export const seenMessage = async (idConversationOrReq, res) => {
  let idConversation;
  
  // Xử lý các trường hợp khác nhau của tham số đầu vào
  if (typeof idConversationOrReq === 'string' || idConversationOrReq instanceof String) {
    // Trường hợp là string ID
    idConversation = idConversationOrReq;
  } else if (idConversationOrReq && idConversationOrReq.params && idConversationOrReq.params.id) {
    // Trường hợp là HTTP request
    idConversation = idConversationOrReq.params.id;
  } else {
    console.error("Invalid parameters for seenMessage");
    if (res) {
      return res.status(400).json({ error: "Invalid conversation ID" });
    }
    return false;
  }

  try {
    await MessageModel.updateMany(
      { idConversation: idConversation },
      { seen: true }
    );
    
    if (res) {
      // Nếu là HTTP request, trả về response
      res.status(200).json({ message: "Messages marked as seen" });
    }
    return true;
  } catch (error) {
    console.error("Error updating messages:", error);
    if (res) {
      res.status(500).json({ error: "Failed to mark messages as seen" });
    }
    return false;
  }
};

export const revokeMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    if (!messageId) {
      return res.status(400).json({ error: "Message ID is required" });
    }

    // Tìm tin nhắn
    const message = await MessageModel.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Kiểm tra người thu hồi tin nhắn có phải là người gửi không
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only revoke your own messages" });
    }

    // Cập nhật tình trạng thu hồi tin nhắn
    message.isRevoked = true;
    await message.save();

    return res.status(200).json({
      success: true,
      message: "Message revoked successfully"
    });
  } catch (error) {
    console.error("Error revoking message:", error);
    return res.status(500).json({ error: "Failed to revoke message" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    if (!messageId) {
      return res.status(400).json({ error: "Message ID is required" });
    }

    // Tìm tin nhắn
    const message = await MessageModel.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Không cần kiểm tra người xóa có phải người gửi không
    // Bất kỳ ai cũng có thể xóa tin nhắn ở phía của họ
    
    // Kiểm tra xem người dùng đã xóa tin nhắn này chưa
    if (message.deletedBy && message.deletedBy.some(id => id.toString() === userId.toString())) {
      return res.status(400).json({ error: "Message already deleted by you" });
    }
    
    // Thêm userId vào mảng deletedBy
    if (!message.deletedBy) {
      message.deletedBy = [];
    }
    
    message.deletedBy.push(userId);
    await message.save();

    return res.status(200).json({
      success: true,
      message: "Message deleted for you"
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(500).json({ error: "Failed to delete message" });
  }
};

export const forwardMessage = async (req, res) => {
  try {
    const { messageId, conversationId } = req.body;
    const userId = req.user._id;

    if (!messageId || !conversationId) {
      return res.status(400).json({ error: "Message ID and Conversation ID are required" });
    }

    // Tìm tin nhắn gốc
    const originalMessage = await MessageModel.findById(messageId).populate('sender', 'name avatar');
    
    if (!originalMessage) {
      return res.status(404).json({ error: "Original message not found" });
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

    return res.status(200).json({
      success: true,
      message: "Message forwarded successfully",
      forwardedMessage: populatedMessage
    });
  } catch (error) {
    console.error("Error forwarding message:", error);
    return res.status(500).json({ error: "Failed to forward message" });
  }
};
