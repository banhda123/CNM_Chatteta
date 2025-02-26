const multer = require('multer');
const path = require('path');
const multerConfig = require('../config/multer');

// Middleware xử lý upload file thông thường
exports.uploadFile = (req, res, next) => {
    const upload = multerConfig.upload.single('file');
    
    upload(req, res, function(err) {
        if (err instanceof multer.MulterError) {
            // Lỗi từ Multer
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'Kích thước file quá lớn (tối đa 10MB)' });
            }
            return res.status(400).json({ message: `Lỗi upload: ${err.message}` });
        } else if (err) {
            // Lỗi không xác định
            return res.status(400).json({ message: err.message || 'Lỗi upload file' });
        }
        
        // Nếu không có file được upload
        if (!req.file) {
            return res.status(400).json({ message: 'Vui lòng chọn file để upload' });
        }
        
        // Thêm đường dẫn file vào request
        req.fileUrl = req.file.path.replace(/\\/g, '/');
        
        next();
    });
};

// Middleware xử lý upload avatar
exports.uploadAvatar = (req, res, next) => {
    const upload = multerConfig.avatarUpload.single('avatar');
    
    upload(req, res, function(err) {
        if (err instanceof multer.MulterError) {
            // Lỗi từ Multer
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'Kích thước ảnh quá lớn (tối đa 2MB)' });
            }
            return res.status(400).json({ message: `Lỗi upload: ${err.message}` });
        } else if (err) {
            // Lỗi không xác định
            return res.status(400).json({ message: err.message || 'Lỗi upload ảnh đại diện' });
        }
        
        // Nếu không có file được upload
        if (!req.file) {
            return res.status(400).json({ message: 'Vui lòng chọn ảnh đại diện' });
        }
        
        // Thêm đường dẫn file vào request
        req.avatarUrl = req.file.path.replace(/\\/g, '/');
        
        next();
    });
};

// Middleware xử lý upload nhiều file
exports.uploadMultipleFiles = (req, res, next) => {
    const upload = multerConfig.upload.array('files', 5); // Tối đa 5 file
    
    upload(req, res, function(err) {
        if (err instanceof multer.MulterError) {
            // Lỗi từ Multer
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'Kích thước file quá lớn (tối đa 10MB)' });
            } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({ message: 'Số lượng file vượt quá giới hạn (tối đa 5 file)' });
            }
            return res.status(400).json({ message: `Lỗi upload: ${err.message}` });
        } else if (err) {
            // Lỗi không xác định
            return res.status(400).json({ message: err.message || 'Lỗi upload file' });
        }
        
        // Nếu không có file được upload
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Vui lòng chọn ít nhất một file để upload' });
        }
        
        // Thêm đường dẫn các file vào request
        req.fileUrls = req.files.map(file => file.path.replace(/\\/g, '/'));
        
        next();
    });
};

// Middleware kiểm tra loại file hình ảnh
exports.checkImageFile = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Vui lòng chọn file' });
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: 'Chỉ chấp nhận file hình ảnh (JPEG, PNG, GIF, WEBP)' });
    }
    
    next();
};

// Middleware kiểm tra loại file video
exports.checkVideoFile = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Vui lòng chọn file' });
    }
    
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    
    if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: 'Chỉ chấp nhận file video (MP4, WebM, QuickTime)' });
    }
    
    next();
};