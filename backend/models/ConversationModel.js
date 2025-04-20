import mongoose from "mongoose";

const Schema = mongoose.Schema;

const User = new Schema({
  idUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const ConversationSchema = new Schema(
  {
    type: { 
      type: String, 
      enum: ['single', 'group'], 
      default: 'single' 
    },
    name: { 
      type: String, 
      default: '' 
    },
    avatar: { 
      type: String, 
      default: 'https://res.cloudinary.com/daclejcpu/image/upload/v1744812771/avatar-mac-dinh-12_i7jnd3.jpg' 
    },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    members: [User],
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

export const ConversationModel = mongoose.model(
  "Conversation",
  ConversationSchema
);
