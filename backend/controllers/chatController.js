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

export const saveMessage = async (req, res) => {
  try {
    const { idConversation, content, type } = req.body;

    if (!idConversation || !content || !type) {
      return res
        .status(400)
        .send({ message: "Vui lòng cung cấp đầy đủ thông tin" });
    }

    const message = new MessageModel({
      idConversation,
      content,
      type,
      seen: false,
      sender: req.user._id,
    });

    await message.save();

    // Cập nhật tin nhắn cuối cùng
    await updateLastMesssage({ idConversation, message: message._id });

    res.send(message);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Lỗi server" });
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
export const seenMessage = async (req, res) => {
  const idConversation = req.params.id;

  try {
    await MessageModel.updateMany(
      { idConversation: idConversation },
      { seen: true }
    );
    res.status(200).json({ message: "Messages marked as seen" });
  } catch (error) {
    console.error("Error updating messages:", error);
    res.status(500).json({ error: "Failed to mark messages as seen" });
  }
};
