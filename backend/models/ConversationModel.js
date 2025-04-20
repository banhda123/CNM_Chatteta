import mongoose from "mongoose";

const Schema = mongoose.Schema;

const User = new Schema({
  idUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const ConversationSchema = new Schema(
  {
    type: String,
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    members: [User],
    isFriendship: { type: Boolean, default: true }, // Trạng thái bạn bè, mặc định là true
  },
  {
    timestamps: true,
  }
);

export const ConversationModel = mongoose.model(
  "Conversation",
  ConversationSchema
);
