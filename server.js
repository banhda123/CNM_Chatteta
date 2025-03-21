const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const db = require('./config/db');
const fs = require('fs');

// Load biến môi trường từ file .env
dotenv.config();

// Khởi tạo ứng dụng Express
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});



// Import routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const friendRoutes = require('./routes/friend');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Middleware để xử lý JSON
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Đảm bảo thư mục uploads tồn tại
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình Multer để lưu file tạm thời trên server
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Thư mục lưu file
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`); // Tên file
  },
});
const upload = multer({ 
  storage,
  limits: { fileSize: 20 * 1024 * 1024 } // Giới hạn 20MB
});

// Sử dụng routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/friends', friendRoutes);

// Phục vụ file HTML
app.get('/socket', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/socket.html'));
});

// Route cho trang đăng nhập
app.get('/', (req, res) => {
  // Chuyển hướng đến trang đăng nhập
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

// Route cho trang chat (để tương thích ngược)
app.get('/chat', (req, res) => {
  res.redirect('/socket');
});

// Route upload file (lưu file trên server)
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không có file được tải lên' });
    }
    // Trả về đường dẫn file
    res.json({ success: true, url: `http://localhost:${process.env.PORT}/uploads/${req.file.filename}` });
  } catch (error) {
    console.error('Lỗi khi tải lên file:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Xử lý real-time messaging với Socket.IO
io.on('connection', async (socket) => {
  console.log('Người dùng đã kết nối:', socket.id);

  socket.on('update-status', async (data) => {
    try {
      if (socket.userId) {
        await User.updateStatus(socket.userId, data.status);
        io.emit('status-update', { userId: socket.userId, status: data.status });
      }
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error);
    }
  });

  const token = socket.handshake.auth.token;
  if (!token) {
    console.log('Không có token, ngắt kết nối');
    socket.disconnect();
    return;
  }

  let conn;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    console.log('Người dùng đã xác thực:', socket.userId);

    conn = await db.getConnection();
    
    // Tự động join vào các cuộc trò chuyện của user
    const [conversations] = await conn.query(`
      SELECT conversation_id 
      FROM conversation_members 
      WHERE user_id = ?
    `, [socket.userId]);
    
    // Kiểm tra và join vào các cuộc trò chuyện
    if (Array.isArray(conversations)) {
      for (const conv of conversations) {
        socket.join(`conversation_${conv.conversation_id}`);
        console.log(`User ${socket.userId} joined conversation ${conv.conversation_id}`);
      }
    }

    // Xử lý join conversation
    socket.on('join-conversation', async (conversationId) => {
      try {
        // Kiểm tra quyền truy cập
        const [membership] = await conn.query(`
          SELECT * FROM conversation_members 
          WHERE conversation_id = ? AND user_id = ?
        `, [conversationId, socket.userId]);

        if (!membership || membership.length === 0) {
          socket.emit('error', { message: 'Không có quyền truy cập cuộc trò chuyện này' });
          return;
        }

        socket.join(`conversation_${conversationId}`);
        console.log(`User ${socket.userId} joined conversation ${conversationId}`);

        // Lấy tin nhắn cũ
        const [messages] = await conn.query(`
          SELECT m.*, u.username as sender_name 
          FROM messages m
          JOIN users u ON m.sender_id = u.id
          WHERE m.conversation_id = ?
          ORDER BY m.created_at ASC
          LIMIT 50
        `, [conversationId]);

        socket.emit('load-messages', messages);
      } catch (error) {
        console.error('Lỗi khi join conversation:', error);
        socket.emit('error', { message: 'Không thể tham gia cuộc trò chuyện' });
      }
    });

    // Xử lý gửi tin nhắn
    // Xử lý gửi tin nhắn
// Xử lý gửi tin nhắn
socket.on('send-message', async (data) => {
  try {
    console.log('Nhận tin nhắn:', data);

    // Kiểm tra quyền gửi tin nhắn
    const membershipResult = await conn.query(`
      SELECT * FROM conversation_members 
      WHERE conversation_id = ? AND user_id = ?
    `, [data.conversationId, socket.userId]);

    if (!membershipResult || membershipResult.length === 0) {
      socket.emit('error', { message: 'Không có quyền gửi tin nhắn trong cuộc trò chuyện này' });
      return;
    }

    // Lưu tin nhắn
    const result = await conn.query(`
      INSERT INTO messages (conversation_id, sender_id, content, type) 
      VALUES (?, ?, ?, ?)
    `, [data.conversationId, socket.userId, data.content, 'text']);

    // Lấy thông tin người gửi
    const senderResult = await conn.query(`
      SELECT username FROM users WHERE id = ?
    `, [socket.userId]);

    const newMessage = {
      id: Number(result.insertId), // Chuyển BigInt sang Number
      conversation_id: Number(data.conversationId),
      sender_id: Number(socket.userId),
      sender_name: senderResult[0].username,
      content: data.content,
      type: 'text',
      created_at: new Date().toISOString() // Chuyển Date sang string
    };

    console.log('Gửi tin nhắn mới:', newMessage);
    io.to(`conversation_${data.conversationId}`).emit('new-message', newMessage);

  } catch (error) {
    console.error('Lỗi khi gửi tin nhắn:', error);
    socket.emit('error', { message: 'Không thể gửi tin nhắn' });
  }
});

  } catch (error) {
    console.error('Lỗi xác thực:', error);
    socket.disconnect();
  }

  socket.on('disconnect', async () => {
    console.log('Người dùng ngắt kết nối:', socket.id);
    try {
      if (socket.userId) {
        await User.updateStatus(socket.userId, 'offline');
        io.emit('status-update', { userId: socket.userId, status: 'offline' });
      }
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error);
    }
    if (conn) conn.release();
  });
});

// Phục vụ file tĩnh từ thư mục uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Khởi chạy server
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
  
  // Kiểm tra kết nối database khi khởi động
  try {
    const dbStatus = await db.testConnection();
    if (dbStatus.success) {
      console.log('✅ ' + dbStatus.message);
    } else {
      console.error('❌ ' + dbStatus.message);
      console.error('Chi tiết lỗi:', dbStatus.error);
      console.log('Vui lòng kiểm tra cấu hình database trong file .env:');
      console.log(`DB_HOST: ${process.env.DB_HOST}`);
      console.log(`DB_PORT: ${process.env.DB_PORT || 3306}`);
      console.log(`DB_USER: ${process.env.DB_USER}`);
      console.log(`DB_NAME: ${process.env.DB_NAME}`);
      console.log('DB_PASSWORD: ********');
    }
  } catch (error) {
    console.error('❌ Lỗi kiểm tra kết nối database:', error.message);
  }
});

