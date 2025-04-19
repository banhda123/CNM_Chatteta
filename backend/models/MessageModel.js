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
    type: {
      type: String,
      enum: ["text", "file", "image", "audio", "video"],
      default: "text"
    },
    seen: Boolean,
    fileUrl: {
      type: String,
      default: null
    },
    fileName: {
      type: String,
      default: null
    },
    fileType: {
      type: String,
      default: null
    },
    isRevoked: {
      type: Boolean,
      default: false
    },
    deletedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }]
  },
  {
    timestamps: true,
  }
);

export const MessageModel = mongoose.model("Message", MessageSchema);
