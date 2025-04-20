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
      enum: ["text", "file", "image", "audio", "video", "pdf", "doc", "excel", "presentation"],
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
    }],
    reactions: {
      type: Object,
      default: {}
    },
    isForwarded: {
      type: Boolean,
      default: false
    },
    originalMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null
    },
    forwardedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    originalSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    originalSenderName: {
      type: String,
      default: null
    },
    originalSenderAvatar: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
  }
);

export const MessageModel = mongoose.model("Message", MessageSchema);
