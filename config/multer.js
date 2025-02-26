const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục uploads tồn tại
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình lưu trữ cho file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Tạo thư mục con theo loại file nếu cần
    let folder = 'others';
    
    if (file.mimetype.startsWith('image/')) {
      folder = 'images';
    } else if (file.mimetype.startsWith('video/')) {
      folder = 'videos';
    } else if (file.mimetype.includes('audio/')) {
      folder = 'audios';
    }
    
    const destPath = path.join(uploadDir, folder);
    
    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    
    cb(null, destPath);
  },
  filename: function (req, file, cb) {
    // Tạo tên file duy nhất bằng cách thêm timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// Kiểm tra loại file
const fileFilter = (req, file, cb) => {
  // Danh sách các loại file được phép
  const allowedTypes = [
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'image/webp',
    'video/mp4', 
    'video/webm',
    'audio/mpeg', 
    'audio/wav',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Loại file không được hỗ trợ'), false);
  }
};

// Giới hạn kích thước file (10MB)
const limits = {
  fileSize: 10 * 1024 * 1024
};

// Cấu hình multer cho upload file thông thường
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits
});

// Cấu hình multer cho upload avatar (chỉ cho phép ảnh)
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const destPath = path.join(uploadDir, 'avatars');
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    cb(null, destPath);
  },
  filename: function (req, file, cb) {
    // Sử dụng userId làm tên file nếu có
    const userId = req.user ? req.user.userId : Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${userId}${ext}`);
  }
});

const avatarFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh cho avatar'), false);
  }
};

const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

module.exports = {
  upload,
  avatarUpload,
  uploadDir
};