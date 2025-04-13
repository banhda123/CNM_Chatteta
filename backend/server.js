const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { body, validationResult } = require('express-validator');
const fs = require('fs').promises;

const db = require('./config/db');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const socketHandler = require('./socket');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: ['http://localhost:3000', 'http://192.168.1.7:3000'], 
    methods: ['GET', 'POST'], 
    credentials: true 
  }
});

// Đặt io vào global để có thể sử dụng từ bất kỳ đâu trong ứng dụng
global.io = io;

// Security middleware
app.use(helmet());
app.use(cors({ 
  origin: ['http://localhost:3000', 'http://192.168.1.7:3000'],
  credentials: true 
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Compression
app.use(compression());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => req.method === 'OPTIONS' ? res.sendStatus(200) : next());

// File upload configuration
const uploadDir = path.join(__dirname, 'uploads');
const avatarDir = path.join(uploadDir, 'avatars');
[uploadDir, avatarDir].forEach(dir => fs.mkdir(dir, { recursive: true }).catch(() => {}));

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: avatarDir,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => /jpeg|jpg|png|gif/.test(file.mimetype) ? cb(null, true) : cb('Chỉ chấp nhận file ảnh!')
});

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Socket.io setup
const socketMiddleware = socketHandler(io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', socketMiddleware, require('./routes/chat'));
app.use('/api/friends', socketMiddleware, require('./routes/friend'));
app.use('/api/users', socketMiddleware, require('./routes/user'));

// File upload handlers with validation
const handleUpload = (req, res, dir) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  res.json({ 
    success: true, 
    url: `${process.env.BASE_URL || 'http://localhost:5000'}${dir}/${req.file.filename}` 
  });
};

app.post('/api/upload', 
  upload.single('file'),
  [body('file').custom((value, { req }) => {
    if (!req.file) {
      throw new Error('File is required');
    }
    return true;
  })],
  (req, res) => handleUpload(req, res, '/uploads')
);

app.post('/api/users/avatar', 
  avatarUpload.single('avatar'),
  [body('avatar').custom((value, { req }) => {
    if (!req.file) {
      throw new Error('Avatar is required');
    }
    return true;
  })],
  (req, res) => handleUpload(req, res, '/uploads/avatars')
);

// Static files
app.use('/uploads', express.static(uploadDir));

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  try {
    const { success, message, error } = await db.testConnection();
    if (success) {
      logger.info(`✅ ${message}`);
    } else {
      logger.error(`❌ ${message}\nError details: ${error}`);
    }
  } catch (error) {
    logger.error(`❌ Database connection error: ${error.message}`);
  }
});