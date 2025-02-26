const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Đăng ký
router.post('/register', async (req, res) => {
    try {
        const { username, password, fullname } = req.body;
        const conn = await db.getConnection();
        
        // Kiểm tra username tồn tại
        const userExists = await conn.query(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );
        
        if (userExists.length > 0) {
            conn.release();
            return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Thêm user mới
        const result = await conn.query(
            'INSERT INTO users (username, password, fullname) VALUES (?, ?, ?)',
            [username, hashedPassword, fullname]
        );
        
        conn.release();
        res.status(201).json({ message: 'Đăng ký thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Đăng nhập
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const conn = await db.getConnection();
        
        const users = await conn.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        
        conn.release();

        if (users.length === 0) {
            return res.status(401).json({ message: 'Thông tin đăng nhập không chính xác' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ message: 'Thông tin đăng nhập không chính xác' });
        }

        // Tạo JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                fullname: user.fullname,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;