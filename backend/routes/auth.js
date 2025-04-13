const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Rate limiting cho đăng nhập/đăng ký
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 5, // giới hạn 5 lần thử
    message: { 
        success: false,
        message: 'Quá nhiều lần thử, vui lòng thử lại sau 15 phút'
    }
});

// Validation rules
const registerValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Tên đăng nhập phải từ 3-50 ký tự')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới'),
    body('password')
        .isLength({ min: 6, max: 100 })
        .withMessage('Mật khẩu phải từ 6-100 ký tự'),
    body('fullname')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Họ tên phải từ 2-100 ký tự')
];

const loginValidation = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Tên đăng nhập là bắt buộc'),
    body('password')
        .notEmpty()
        .withMessage('Mật khẩu là bắt buộc')
];

// Đăng ký
router.post('/register', registerValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false,
            errors: errors.array() 
        });
    }

    let conn;
    try {
        const { username, password, fullname } = req.body;
        
        conn = await db.getConnection();
        if (!conn) {
            return res.status(500).json({ 
                success: false,
                message: 'Không thể kết nối đến cơ sở dữ liệu' 
            });
        }
        
        // Kiểm tra username tồn tại
        const [existingUsers] = await conn.query(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Tên đăng nhập đã tồn tại' 
            });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Thêm user mới
        const [result] = await conn.query(
            'INSERT INTO users (username, password, fullname, status) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, fullname, 'offline']
        );
        
        res.status(201).json({ 
            success: true,
            message: 'Đăng ký thành công',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Lỗi đăng ký:', error);
        res.status(500).json({ 
            success: false,
            message: 'Lỗi server',
            error: error.message 
        });
    } finally {
        if (conn) conn.release();
    }
});

// Đăng nhập
router.post('/login', loginValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false,
            errors: errors.array() 
        });
    }

    let conn;
    try {
        const { username, password } = req.body;
        
        conn = await db.getConnection();
        if (!conn) {
            return res.status(500).json({ 
                success: false,
                message: 'Không thể kết nối đến cơ sở dữ liệu' 
            });
        }
        
        console.log(`Đang đăng nhập với username: ${username}`);
        
        // Lấy thông tin user
        const result = await conn.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        
        // Xử lý đúng cấu trúc kết quả truy vấn từ MariaDB
        const users = Array.isArray(result[0]) ? result[0] : result;
        
        console.log('Kết quả truy vấn:', JSON.stringify(users));
        console.log(`Tìm thấy ${users.length} user`);
        
        if (!users || users.length === 0) {
            return res.status(401).json({ 
                success: false,
                message: 'Tên đăng nhập hoặc mật khẩu không đúng' 
            });
        }
        
        const user = users[0];
        
        if (!user || !user.username || !user.password) {
            console.error('Dữ liệu user không hợp lệ:', user);
            return res.status(500).json({
                success: false,
                message: 'Lỗi xác thực người dùng'
            });
        }
        
        console.log('Đang kiểm tra mật khẩu cho user:', user.username);
        
        // So sánh mật khẩu
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
            return res.status(401).json({ 
                success: false,
                message: 'Tên đăng nhập hoặc mật khẩu không đúng' 
            });
        }
        
        console.log('Mật khẩu hợp lệ, tạo token...');
        
        // Tạo JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Cập nhật trạng thái online
        await conn.query(
            'UPDATE users SET status = ? WHERE id = ?',
            ['online', user.id]
        );
        
        // Trả về thông tin đăng nhập thành công
        return res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                fullname: user.fullname,
                avatar: user.avatar || null,
                status: 'online'
            }
        });
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Đã có lỗi xảy ra, vui lòng thử lại sau',
            error: error.message
        });
    } finally {
        if (conn) conn.release();
    }
});

module.exports = router;