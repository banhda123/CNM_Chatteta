import mongoose from "mongoose";
import { ConversationModel } from "../models/ConversationModel.js";
import { MessageModel } from "../models/MessageModel.js";
import { UsersModel } from "../models/UserModel.js";

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

export const createGroupConversation = async (req, res) => {
  try {
    const { name, members, avatar } = req.body;
    const creatorId = req.user._id;
    
    // Validate input
    if (!name || !members || !Array.isArray(members) || members.length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: "Group name and at least 2 members are required" 
      });
    }
    
    // Create new group conversation - don't set lastMessage initially
    const newGroupConversation = new ConversationModel({
      type: "group",
      name: name,
      avatar: avatar || "https://res.cloudinary.com/daclejcpu/image/upload/v1744812771/avatar-mac-dinh-12_i7jnd3.jpg",
      // Remove the empty string for lastMessage
      members: [],
      admin: creatorId
    });
    
    // Add creator to members if not already included
    if (!members.includes(creatorId.toString())) {
      members.push(creatorId.toString());
    }
    
    // Add all members to the conversation
    for (const memberId of members) {
      try {
        // Convert string ID to MongoDB ObjectID
        const objectId = new mongoose.Types.ObjectId(memberId);
        newGroupConversation.members.push({ idUser: objectId });
      } catch (error) {
        console.error(`Invalid ObjectID format for member: ${memberId}`, error);
        // Skip invalid IDs instead of failing the whole operation
      }
    }
    
    // Save the conversation without lastMessage first
    await newGroupConversation.save();
    
    // Get member names for the welcome message
    const memberIds = members.filter(id => id !== creatorId.toString());
    let memberNames = [];
    
    try {
      // Find user information for each member
      const { UsersModel } = await import("../models/UserModel.js");
      const users = await UsersModel.find({ _id: { $in: memberIds } }, 'name');
      memberNames = users.map(user => user.name);
    } catch (error) {
      console.error("Error fetching member names:", error);
      // Continue with empty names if there's an error
    }
    
    // Create a welcome message with member information
    const welcomeMessage = new MessageModel({
      idConversation: newGroupConversation._id,
      content: memberNames.length > 0 
        ? `${req.user.name} đã tạo nhóm và mời ${memberNames.join(', ')} vào nhóm`
        : `${req.user.name} đã tạo nhóm ${name}`,
      type: 'system', // Now using system type for centered, subtle messages
      seen: false,
      sender: creatorId,
    });
    
    const savedMessage = await welcomeMessage.save();
    
    // Now update the conversation with the lastMessage ID
    await ConversationModel.findByIdAndUpdate(
      newGroupConversation._id,
      { lastMessage: savedMessage._id }
    );
    
    // Populate member information for response
    const populatedConversation = await ConversationModel.findById(newGroupConversation._id)
      .populate({
        path: "members.idUser",
        select: { name: 1, avatar: 1 }
      })
      .populate("admin", "name avatar");
    
    return res.status(201).json({
      success: true,
      message: "Group conversation created successfully",
      conversation: populatedConversation
    });
  } catch (error) {
    console.error("Error creating group conversation:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to create group conversation", 
      error: error.message 
    });
  }
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

// Group chat management functions

export const addMemberToGroup = async (req, res) => {
  try {
    const { conversationId, memberIds } = req.body;
    const userId = req.user._id;

    if (!conversationId || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Conversation ID and at least one member ID are required" 
      });
    }

    // Find the conversation
    const conversation = await ConversationModel.findById(conversationId)
      .populate({
        path: "members.idUser",
        select: "name avatar"
      });

    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: "Conversation not found" 
      });
    }

    // Check if it's a group conversation
    if (conversation.type !== "group") {
      return res.status(400).json({ 
        success: false, 
        message: "This operation is only allowed for group conversations" 
      });
    }

    // Check if the user is admin or a member of the group
    const isAdmin = conversation.admin && conversation.admin.toString() === userId.toString();
    const isMember = conversation.members.some(member => 
      member.idUser && member.idUser._id && member.idUser._id.toString() === userId.toString()
    );

    if (!isAdmin && !isMember) {
      return res.status(403).json({ 
        success: false, 
        message: "You don't have permission to add members to this group" 
      });
    }

    // Get current member IDs
    const currentMemberIds = conversation.members.map(member => 
      member.idUser._id.toString()
    );

    // Filter out members that are already in the group
    const newMemberIds = memberIds.filter(id => !currentMemberIds.includes(id));

    if (newMemberIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "All specified members are already in the group" 
      });
    }

    // Add new members
    for (const memberId of newMemberIds) {
      conversation.members.push({ idUser: memberId });
    }

    await conversation.save();

    // Create system message about new members
    const addedUsers = await UsersModel.find({ _id: { $in: newMemberIds } }, "name");
    const addedNames = addedUsers.map(user => user.name).join(", ");
    
    const systemMessage = new MessageModel({
      idConversation: conversationId,
      content: `${req.user.name} added ${addedNames} to the group`,
      type: 'system',
      seen: false,
      sender: userId,
    });
    
    const savedMessage = await systemMessage.save();
    
    // Update last message
    await updateLastMesssage({ 
      idConversation: conversationId, 
      message: savedMessage._id 
    });

    // Get updated conversation with populated members
    const updatedConversation = await ConversationModel.findById(conversationId)
      .populate({
        path: "members.idUser",
        select: "name avatar"
      })
      .populate("admin", "name avatar");

    return res.status(200).json({
      success: true,
      message: "Members added to group successfully",
      conversation: updatedConversation
    });
  } catch (error) {
    console.error("Error adding members to group:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to add members to group", 
      error: error.message 
    });
  }
};

export const removeMemberFromGroup = async (req, res) => {
  try {
    const { conversationId, memberId } = req.params;
    const userId = req.user._id;

    if (!conversationId || !memberId) {
      return res.status(400).json({ 
        success: false, 
        message: "Conversation ID and member ID are required" 
      });
    }

    // Find the conversation
    const conversation = await ConversationModel.findById(conversationId)
      .populate({
        path: "members.idUser",
        select: "name avatar"
      });

    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: "Conversation not found" 
      });
    }

    // Check if it's a group conversation
    if (conversation.type !== "group") {
      return res.status(400).json({ 
        success: false, 
        message: "This operation is only allowed for group conversations" 
      });
    }

    // Check if the user is admin
    const isAdmin = conversation.admin && conversation.admin.toString() === userId.toString();
    
    // Only admin can remove members or members can remove themselves
    if (!isAdmin && memberId !== userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "You don't have permission to remove this member" 
      });
    }

    // Check if the member exists in the group
    const memberIndex = conversation.members.findIndex(member => 
      member.idUser._id.toString() === memberId
    );

    if (memberIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: "Member not found in the group" 
      });
    }

    // Get member name before removing
    const memberName = conversation.members[memberIndex].idUser.name;

    // Remove the member
    conversation.members.splice(memberIndex, 1);

    // If admin is removed, assign a new admin if there are members left
    if (memberId === conversation.admin.toString() && conversation.members.length > 0) {
      conversation.admin = conversation.members[0].idUser._id;
    }

    await conversation.save();

    // Create system message about member removal
    const systemMessage = new MessageModel({
      idConversation: conversationId,
      content: memberId === userId.toString() 
        ? `${memberName} left the group` 
        : `${req.user.name} removed ${memberName} from the group`,
      type: 'system',
      seen: false,
      sender: userId,
    });
    
    const savedMessage = await systemMessage.save();
    
    // Update last message
    await updateLastMesssage({ 
      idConversation: conversationId, 
      message: savedMessage._id 
    });

    // Get updated conversation with populated members
    const updatedConversation = await ConversationModel.findById(conversationId)
      .populate({
        path: "members.idUser",
        select: "name avatar"
      })
      .populate("admin", "name avatar");

    return res.status(200).json({
      success: true,
      message: "Member removed from group successfully",
      conversation: updatedConversation
    });
  } catch (error) {
    console.error("Error removing member from group:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to remove member from group", 
      error: error.message 
    });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    if (!conversationId) {
      return res.status(400).json({ 
        success: false, 
        message: "Conversation ID is required" 
      });
    }

    // Find the conversation
    const conversation = await ConversationModel.findById(conversationId)
      .populate({
        path: "members.idUser",
        select: "name avatar"
      });

    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: "Conversation not found" 
      });
    }

    // Check if it's a group conversation
    if (conversation.type !== "group") {
      return res.status(400).json({ 
        success: false, 
        message: "This operation is only allowed for group conversations" 
      });
    }

    // Check if the user is a member of the group
    const memberIndex = conversation.members.findIndex(member => 
      member.idUser._id.toString() === userId.toString()
    );

    if (memberIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: "You are not a member of this group" 
      });
    }

    // Get user name before removing
    const userName = req.user.name;

    // Remove the user from members
    conversation.members.splice(memberIndex, 1);

    // If the user is admin and there are members left, assign a new admin
    if (conversation.admin.toString() === userId.toString() && conversation.members.length > 0) {
      conversation.admin = conversation.members[0].idUser._id;
    }

    // If no members left, delete the conversation
    if (conversation.members.length === 0) {
      await ConversationModel.findByIdAndDelete(conversationId);
      await MessageModel.deleteMany({ idConversation: conversationId });

      return res.status(200).json({
        success: true,
        message: "You left the group and it was deleted as no members remain"
      });
    }

    await conversation.save();

    // Create system message about leaving
    const systemMessage = new MessageModel({
      idConversation: conversationId,
      content: `${userName} left the group`,
      type: 'system',
      seen: false,
      sender: userId,
    });
    
    const savedMessage = await systemMessage.save();
    
    // Update last message
    await updateLastMesssage({ 
      idConversation: conversationId, 
      message: savedMessage._id 
    });

    return res.status(200).json({
      success: true,
      message: "You left the group successfully"
    });
  } catch (error) {
    console.error("Error leaving group:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to leave group", 
      error: error.message 
    });
  }
};

export const updateGroupInfo = async (req, res) => {
  try {
    const { conversationId, name, avatar } = req.body;
    const userId = req.user._id;

    if (!conversationId || (!name && !avatar)) {
      return res.status(400).json({ 
        success: false, 
        message: "Conversation ID and at least one field to update are required" 
      });
    }

    // Find the conversation
    const conversation = await ConversationModel.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: "Conversation not found" 
      });
    }

    // Check if it's a group conversation
    if (conversation.type !== "group") {
      return res.status(400).json({ 
        success: false, 
        message: "This operation is only allowed for group conversations" 
      });
    }

    // Check if the user is admin or a member
    const isAdmin = conversation.admin && conversation.admin.toString() === userId.toString();
    const isMember = conversation.members.some(member => 
      member.idUser && member.idUser.toString() === userId.toString()
    );

    if (!isAdmin && !isMember) {
      return res.status(403).json({ 
        success: false, 
        message: "You don't have permission to update this group" 
      });
    }

    // Update fields
    let updateMessage = "";
    if (name) {
      conversation.name = name;
      updateMessage = `${req.user.name} changed the group name to ${name}`;
    }

    if (avatar) {
      conversation.avatar = avatar;
      updateMessage = updateMessage || `${req.user.name} changed the group avatar`;
    }

    await conversation.save();

    // Create system message about the update
    const systemMessage = new MessageModel({
      idConversation: conversationId,
      content: updateMessage,
      type: 'system',
      seen: false,
      sender: userId,
    });
    
    const savedMessage = await systemMessage.save();
    
    // Update last message
    await updateLastMesssage({ 
      idConversation: conversationId, 
      message: savedMessage._id 
    });

    // Get updated conversation with populated members
    const updatedConversation = await ConversationModel.findById(conversationId)
      .populate({
        path: "members.idUser",
        select: "name avatar"
      })
      .populate("admin", "name avatar");

    return res.status(200).json({
      success: true,
      message: "Group information updated successfully",
      conversation: updatedConversation
    });
  } catch (error) {
    console.error("Error updating group info:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to update group information", 
      error: error.message 
    });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    if (!conversationId) {
      return res.status(400).json({ 
        success: false, 
        message: "Conversation ID is required" 
      });
    }

    // Find the conversation
    const conversation = await ConversationModel.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: "Conversation not found" 
      });
    }

    // Check if it's a group conversation
    if (conversation.type !== "group") {
      return res.status(400).json({ 
        success: false, 
        message: "This operation is only allowed for group conversations" 
      });
    }

    // Check if the user is admin
    const isAdmin = conversation.admin && conversation.admin.toString() === userId.toString();

    if (!isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: "Only the group admin can delete the group" 
      });
    }

    // Delete all messages in the conversation
    await MessageModel.deleteMany({ idConversation: conversationId });
    
    // Delete the conversation
    await ConversationModel.findByIdAndDelete(conversationId);

    return res.status(200).json({
      success: true,
      message: "Group deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting group:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to delete group", 
      error: error.message 
    });
  }
};

export const setAdmin2 = async (req, res) => {
  try {
    const { conversationId, memberId } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!conversationId || !memberId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Find the conversation
    const conversation = await ConversationModel.findById(conversationId)
      .populate("admin", "name avatar")
      .populate("admin2", "name avatar")
      .populate({
        path: "members.idUser",
        select: "name avatar"
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      });
    }

    // Check if the requester is the admin
    if (!conversation.admin || conversation.admin._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only admin can set admin2"
      });
    }

    // Check if the member exists in the conversation
    const memberToPromote = conversation.members.find(
      member => member.idUser._id.toString() === memberId
    );

    if (!memberToPromote) {
      return res.status(404).json({
        success: false,
        message: "Member not found in conversation"
      });
    }

    // Set the admin2 role
    conversation.admin2 = memberId;
    memberToPromote.role = "admin2";

    // Save the conversation
    await conversation.save();

    // Create system message about the change
    const systemMessage = new MessageModel({
      idConversation: conversationId,
      content: `${req.user.name} đã đặt ${memberToPromote.idUser.name} làm phó nhóm`,
      type: 'system',
      seen: false,
      sender: userId,
    });
    
    const savedMessage = await systemMessage.save();
    
    // Update last message
    await updateLastMesssage({ 
      idConversation: conversationId, 
      message: savedMessage._id 
    });

    // Get updated conversation with populated fields
    const updatedConversation = await ConversationModel.findById(conversationId)
      .populate("admin", "name avatar")
      .populate("admin2", "name avatar")
      .populate({
        path: "members.idUser",
        select: "name avatar"
      });

    return res.status(200).json({
      success: true,
      message: "Admin2 set successfully",
      conversation: updatedConversation
    });
  } catch (error) {
    console.error("Error setting admin2:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to set admin2",
      error: error.message
    });
  }
};

export const removeAdmin2 = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    if (!conversationId) {
      return res.status(400).json({ 
        success: false, 
        message: "Conversation ID is required" 
      });
    }

    // Find the conversation
    const conversation = await ConversationModel.findById(conversationId)
      .populate("admin", "name avatar")
      .populate("admin2", "name avatar")
      .populate({
        path: "members.idUser",
        select: "name avatar"
      });

    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: "Conversation not found" 
      });
    }

    // Check if it's a group conversation
    if (conversation.type !== "group") {
      return res.status(400).json({ 
        success: false, 
        message: "This operation is only allowed for group conversations" 
      });
    }

    // Check if the user is admin
    if (!conversation.admin || conversation.admin._id.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "Only the group admin can remove admin2" 
      });
    }

    // Check if there's an admin2
    if (!conversation.admin2) {
      return res.status(404).json({ 
        success: false, 
        message: "No admin2 found in the group" 
      });
    }

    // Get admin2 ID in string format for comparison
    const admin2Id = conversation.admin2._id ? conversation.admin2._id.toString() : conversation.admin2.toString();

    // Find the admin2 member
    const admin2Member = conversation.members.find(member => 
      member.idUser._id.toString() === admin2Id
    );

    if (!admin2Member) {
      return res.status(404).json({ 
        success: false, 
        message: "No admin2 found in the group" 
      });
    }

    // Store admin2 name before removing role
    const admin2Name = admin2Member.idUser.name;

    // Remove admin2 role
    admin2Member.role = "member";
    conversation.admin2 = null;

    // Save the conversation
    await conversation.save();

    // Create system message about the change
    const systemMessage = new MessageModel({
      idConversation: conversationId,
      content: `${req.user.name} đã gỡ ${admin2Name} khỏi vị trí phó nhóm`,
      type: 'system',
      seen: false,
      sender: userId,
    });
    
    const savedMessage = await systemMessage.save();
    
    // Update last message
    await updateLastMesssage({ 
      idConversation: conversationId, 
      message: savedMessage._id 
    });

    // Get updated conversation with populated fields
    const updatedConversation = await ConversationModel.findById(conversationId)
      .populate("admin", "name avatar")
      .populate("admin2", "name avatar")
      .populate({
        path: "members.idUser",
        select: "name avatar"
      });

    return res.status(200).json({
      success: true,
      message: "Admin2 removed successfully",
      conversation: updatedConversation
    });
  } catch (error) {
    console.error("Error removing admin2:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to remove admin2", 
      error: error.message 
    });
  }
};

export const updateGroupPermissions = async (req, res) => {
  try {
    const { conversationId, permissions } = req.body;
    const userId = req.user._id;

    if (!conversationId || !permissions) {
      return res.status(400).json({ 
        success: false, 
        message: "Conversation ID and permissions are required" 
      });
    }

    // Find the conversation
    const conversation = await ConversationModel.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: "Conversation not found" 
      });
    }

    // Check if it's a group conversation
    if (conversation.type !== "group") {
      return res.status(400).json({ 
        success: false, 
        message: "This operation is only allowed for group conversations" 
      });
    }

    // Check if the user is admin
    const isAdmin = conversation.admin && conversation.admin.toString() === userId.toString();

    if (!isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: "Only the group admin can update permissions" 
      });
    }

    // Update permissions
    conversation.permissions = {
      ...conversation.permissions,
      ...permissions
    };

    await conversation.save();

    // Create system message about the change
    const systemMessage = new MessageModel({
      idConversation: conversationId,
      content: `${req.user.name} đã cập nhật quyền hạn của nhóm`,
      type: 'system',
      seen: false,
      sender: userId,
    });
    
    const savedMessage = await systemMessage.save();
    
    // Update last message
    await updateLastMesssage({ 
      idConversation: conversationId, 
      message: savedMessage._id 
    });

    // Get updated conversation with populated members
    const updatedConversation = await ConversationModel.findById(conversationId)
      .populate({
        path: "members.idUser",
        select: "name avatar"
      })
      .populate("admin", "name avatar")
      .populate("admin2", "name avatar");

    return res.status(200).json({
      success: true,
      message: "Group permissions updated successfully",
      conversation: updatedConversation
    });
  } catch (error) {
    console.error("Error updating group permissions:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to update group permissions", 
      error: error.message 
    });
  }
};
