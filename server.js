// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');

// Load biến môi trường từ file .env
dotenv.config();

// Khởi tạo ứng dụng Express
const app = express();
const server = http.createServer(app);
const io = new Server(server);
// Phục vụ file HTML
app.get('/socket', (req, res) => {
  res.sendFile(path.join(__dirname, 'socket.html'));
});

// Cấu hình Multer để lưu file tạm thời trên server
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Thư mục lưu file
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`); // Tên file
  },
});
const upload = multer({ storage });

// Middleware để xử lý JSON
app.use(express.json());

// Route đăng nhập (giả lập)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === '123456') {
    res.json({ success: true, message: 'Đăng nhập thành công' });
  } else {
    res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' });
  }
});

// Route upload file (lưu file trên server)
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Không có file được tải lên' });
  }
  // Trả về đường dẫn file
  res.json({ success: true, url: `http://localhost:${process.env.PORT}/uploads/${req.file.filename}` });
});

// Xử lý real-time messaging với Socket.IO
io.on('connection', (socket) => {
  console.log('Một người dùng đã kết nối:', socket.id);

  socket.on('send-message', (message) => {
    io.emit('receive-message', message);
  });

  socket.on('disconnect', () => {
    console.log('Người dùng đã ngắt kết nối:', socket.id);
  });
});

// Phục vụ file tĩnh từ thư mục uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Phục vụ file HTML
app.get('/socket', (req, res) => {
  res.sendFile(path.join(__dirname, 'socket.html'));
});
  

// Khởi chạy server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});