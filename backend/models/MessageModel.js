import mongoose from "mongoose";

const Schema = mongoose.Schema;

// const User = new Schema({
//   idUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
// });

const MessageSchema = new Schema(
  {
    idConversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: String,
    type: String,
    seen: Boolean,
  },
  {
    timestamps: true,
  }
);

export const MessageModel = mongoose.model("Message", MessageSchema);
