import express from "express";
import {
  getAllConversation,
  getAllConversationByUser,
  getAllFriend,
  getAllMessageByConversation,
  saveMessage,
  seenMessage
} from "../controllers/ChatController.js";
import { isAuth } from "../utils/index.js";

const ChatRouter = express.Router();

ChatRouter.get("/", getAllConversation);
ChatRouter.get("/allmessage/:id", getAllMessageByConversation);
ChatRouter.get("/:id", getAllConversationByUser);
ChatRouter.get("/friend/:id", getAllFriend);

ChatRouter.post("/message", isAuth, saveMessage);
ChatRouter.post("/seen/:id", isAuth, seenMessage);

export default ChatRouter;
