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


// Sử dụng routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Phục vụ file HTML
app.get('/socket', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/socket.html'));
});


// Xử lý real-time messaging với Socket.IO
io.on('connection', (socket) => {
  console.log('Người dùng đã kết nối:', socket.id);

  // Xác thực người dùng qua token
  const token = socket.handshake.auth.token;
  if (!token) {
    console.log('Không có token, ngắt kết nối');
    socket.disconnect();
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    console.log('Người dùng đã xác thực:', socket.userId);


    // Gửi tin nhắn
    socket.on('send-message', async (data) => {
      try {
        console.log('Nhận tin nhắn:', data);
        const conn = await db.getConnection();
        const [result] = await conn.query(
          'INSERT INTO messages (conversation_id, sender_id, content, type, file_url) VALUES (?, ?, ?, ?, ?)',
          [data.conversationId, socket.userId, data.content, data.type || 'text', data.fileUrl || null]
        );

        // Lấy thông tin người gửi
        const [users] = await conn.query(
          'SELECT username, avatar FROM users WHERE id = ?',
          [socket.userId]
        );

        const message = {
          id: result.insertId,
          ...data,
          sender_id: socket.userId,
          sender_name: users[0].username,
          sender_avatar: users[0].avatar,
          created_at: new Date()
        };

        io.to(`conversation_${data.conversationId}`).emit('new-message', message);
        conn.release();
      } catch (error) {
        console.error('Lỗi khi gửi tin nhắn:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Người dùng đã ngắt kết nối:', socket.id);
    });

  } catch (error) {
    console.error('Lỗi xác thực token:', error);
    socket.disconnect();
  }
});

// Phục vụ file tĩnh từ thư mục uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Thêm route cho trang socket.html
app.get('/socket', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/socket.html'));
});

// Thêm route mặc định
app.get('/', (req, res) => {
  res.send('Zalo Clone API đang chạy');
});

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

