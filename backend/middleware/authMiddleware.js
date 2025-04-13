const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authMiddleware = async (req, res, next) => {
    try {
        // Lấy token từ header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
        }

        // Xác thực token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Kiểm tra người dùng có tồn tại không
        const conn = await db.getConnection();
        try {
            const [users] = await conn.query(
                'SELECT id, username FROM users WHERE id = ?',
                [decoded.userId]
            );

            if (!users || users.length === 0) {
                return res.status(401).json({ message: 'Người dùng không tồn tại' });
            }

            // Thêm thông tin người dùng vào request
            req.user = {
                userId: decoded.userId,
                username: decoded.username
            };

            next();
        } catch (error) {
            console.error('Lỗi truy vấn database:', error);
            return res.status(500).json({ message: 'Lỗi kết nối database' });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error('Lỗi xác thực:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token không hợp lệ' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token đã hết hạn' });
        }
        res.status(500).json({ message: 'Lỗi server' });
    }
};

module.exports = authMiddleware; 