import express from 'express'
import {
  changeAvatar,
  checkCodeOtp,
  Demo,
  getAllFriendByUser,
  getAllPeopleRequestByUser,
  getNewToken,
  getUser,
  getUserById,
  Login,
  Register,
  searchUser,
  sendMail,
  UpdatePassword,
  addFriend,
  acceptFriend,
  DontAcceptFriend,
  unFriend
} from "../controllers/UserController.js";
import { isAuth } from "../utils/index.js";
import { upload } from "../utils/uploadImage.js";

const UserRouter = express.Router();

UserRouter.get("/", getUser);
UserRouter.post("/search", searchUser);
UserRouter.get("/:id", getUserById);
UserRouter.post("/login", Login);
UserRouter.post("/register", Register);

UserRouter.post("/sendmail", sendMail);
UserRouter.post("/checkotp", checkCodeOtp);
UserRouter.post("/updatepassword", UpdatePassword);
UserRouter.post("/getnewtoken", getNewToken);

UserRouter.post("/avatar", isAuth, upload.single("image"), changeAvatar);

// API bạn bè
UserRouter.post("/addFriend", isAuth, addFriend);
UserRouter.post("/acceptFriend", isAuth, acceptFriend);
UserRouter.post("/dontAcceptFriend", isAuth, DontAcceptFriend);
UserRouter.post("/unFriend", isAuth, unFriend);

UserRouter.get("/getAllFriendByUser/:id", getAllFriendByUser);
UserRouter.get("/getAllPeopleRequestByUser/:id", getAllPeopleRequestByUser);

UserRouter.get("/demo", Demo);

export default UserRouter
