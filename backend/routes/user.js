const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { body, param, query, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Validation rules
const profileValidation = [
    body('fullname')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Họ tên phải từ 2-100 ký tự'),
    body('email')
        .optional()
        .isEmail()
        .withMessage('Email không hợp lệ'),
    body('phone')
        .optional()
        .matches(/^[0-9]{10,11}$/)
        .withMessage('Số điện thoại không hợp lệ')
];

const passwordValidation = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Mật khẩu hiện tại là bắt buộc'),
    body('newPassword')
        .isLength({ min: 6, max: 100 })
        .withMessage('Mật khẩu mới phải từ 6-100 ký tự')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số')
];

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
router.get('/profile/:id?', 
    authMiddleware,
    param('id').optional().isInt().withMessage('ID người dùng không hợp lệ'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        userController.getUserProfile(req, res);
});

// Cập nhật thông tin profile
router.put('/profile', 
    authMiddleware,
    profileValidation,
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        userController.updateProfile(req, res);
});

// Cập nhật avatar
router.post('/avatar', 
    authMiddleware, 
    upload.single('avatar'),
    async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ message: 'Vui lòng chọn ảnh đại diện' });
        }
        userController.updateAvatar(req, res);
});

// Đổi mật khẩu
router.put('/password', 
    authMiddleware,
    passwordValidation,
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        userController.changePassword(req, res);
});

// Tìm kiếm người dùng
router.get('/search', 
    authMiddleware,
    query('q').optional().isString().withMessage('Từ khóa tìm kiếm không hợp lệ'),
    query('page').optional().isInt({ min: 1 }).withMessage('Số trang không hợp lệ'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Số lượng kết quả không hợp lệ'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
        }
        userController.searchUsers(req, res);
});

module.exports = router; 