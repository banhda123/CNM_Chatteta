const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Cấu hình multer cho upload file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/avatars');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb('Error: Chỉ chấp nhận file ảnh!');
        }
    }
});

// Xem thông tin profile
router.get('/profile/:id?', authMiddleware, userController.getUserProfile);

// Cập nhật thông tin profile
router.put('/profile', authMiddleware, userController.updateProfile);

// Cập nhật avatar
router.post('/avatar', authMiddleware, upload.single('avatar'), userController.updateAvatar);

// Đổi mật khẩu
router.put('/password', authMiddleware, userController.changePassword);

// Tìm kiếm người dùng
router.get('/search', authMiddleware, userController.searchUsers);

module.exports = router; 