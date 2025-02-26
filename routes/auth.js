const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Đăng ký
router.post('/register', async (req, res) => {
    let conn;
    try {
        const { username, password, fullname } = req.body;
        
        // Kiểm tra dữ liệu đầu vào
        if (!username || !password || !fullname) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
        }

        // Kiểm tra độ dài username và password
        if (username.length > 50 || password.length > 100) {
            return res.status(400).json({ message: 'Tên đăng nhập hoặc mật khẩu quá dài' });
        }
        
        conn = await db.getConnection();
        if (!conn) {
            return res.status(500).json({ message: 'Không thể kết nối đến cơ sở dữ liệu' });
        }
        
        // Kiểm tra username tồn tại
        const users = await conn.query(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );
        
        if (users.length > 0) {
            return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
        }

        // Mã hóa mật khẩu
        let hashedPassword;
        try {
            hashedPassword = await bcrypt.hash(password, 10);
        } catch (hashError) {
            console.error('Lỗi mã hóa mật khẩu:', hashError);
            return res.status(500).json({ message: 'Lỗi mã hóa mật khẩu' });
        }
        
        // Thêm user mới
        const result = await conn.query(
            'INSERT INTO users (username, password, fullname) VALUES (?, ?, ?)',
            [username, hashedPassword, fullname]
        );
        
        res.status(201).json({ 
            success: true,
            message: 'Đăng ký thành công',
            userId: result.insertId.toString() // Chuyển đổi thành chuỗi
        });
    } catch (error) {
        console.error('Lỗi đăng ký:', error);
        res.status(500).json({ 
            message: 'Lỗi server', 
            error: error.message 
        });
    } finally {
        if (conn) {
            conn.release();
        }
    }
});

// Đăng nhập
router.post('/login', async (req, res) => {
    let conn;
    try {
        const { username, password } = req.body;
        
        // Kiểm tra dữ liệu đầu vào
        if (!username || !password) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
        }
        
        conn = await db.getConnection();
        if (!conn) {
            return res.status(500).json({ message: 'Không thể kết nối đến cơ sở dữ liệu' });
        }
        
        const users = await conn.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ message: 'Thông tin đăng nhập không chính xác' });
        }

        const user = users[0];
        if (!user.password) {
            return res.status(401).json({ message: 'Thông tin đăng nhập không chính xác' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Thông tin đăng nhập không chính xác' });
        }

        // Tạo JWT token
        let token;
        try {
            token = jwt.sign(
                { userId: user.id, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
        } catch (jwtError) {
            console.error('Lỗi tạo JWT token:', jwtError);
            return res.status(500).json({ message: 'Lỗi tạo token' });
        }

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                fullname: user.fullname
            }
        });
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({ 
            message: 'Lỗi server',
            error: error.message
        });
    } finally {
        if (conn) {
            conn.release();
        }
    }
});

module.exports = router;