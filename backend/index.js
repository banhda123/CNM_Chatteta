import express from "express";
import cors from "cors";
import UserRouter from "./routers/UserRouter.js";
import ConnectToDB from "./config/DB.js";
import dotenv from "dotenv";
import { createServer } from "http";
import { ConnectSocket } from "./config/Socket.js";
import cloudinary from "./config/Cloudinary.js";
import ChatRouter from "./routers/ChatRouter.js";
import uploadRouter from "./routers/uploadrouter.js";
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = 4000;

ConnectSocket(server);
ConnectToDB();

app.use(
  cors({
    origin: "http://localhost:8081", // Your React dev server
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve static files from uploads directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/user", UserRouter);
app.use("/chat", ChatRouter);
app.use("/", uploadRouter);

server.listen(PORT, () => {
  console.log(`app run on port ${PORT}`);
});
