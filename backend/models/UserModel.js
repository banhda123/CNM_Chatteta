import mongoose from 'mongoose'

const Schema = mongoose.Schema

const FriendSchema = new Schema({
  idUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  idConversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
});

const UserSchema = new Schema(
  {
    name: String,
    phone: String,
    avatar: String,
    password: String,
    otp: String,
    refeshToken: String,
    cloudinary_id: String,

    friends: [FriendSchema],
    myRequest: [FriendSchema], 
    peopleRequest: [FriendSchema],
  },
  {
    timestamps: true,
  }
);

export const UsersModel = mongoose.model("User", UserSchema);
export const FriendsModel = mongoose.model("Friend", FriendSchema);