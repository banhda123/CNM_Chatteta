const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    // Tìm người dùng theo ID
    static async findById(id) {
        const conn = await db.getConnection();
        try {
            const [users] = await conn.query(
                'SELECT id, username, fullname, avatar, status FROM users WHERE id = ?',
                [id]
            );
            return users[0];
        } finally {
            conn.release();
        }
    }
    
    // Tìm người dùng theo username
    static async findByUsername(username) {
        const conn = await db.getConnection();
        try {
            const [users] = await conn.query(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );
            return users[0];
        } finally {
            conn.release();
        }
    }
    
    // Tạo người dùng mới
    static async create(userData) {
        const conn = await db.getConnection();
        try {
            const { username, password, fullname } = userData;
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const [result] = await conn.query(
                'INSERT INTO users (username, password, fullname) VALUES (?, ?, ?)',
                [username, hashedPassword, fullname]
            );
            
            return result.insertId;
        } finally {
            conn.release();
        }
    }
    
    // Cập nhật trạng thái người dùng
    static async updateStatus(userId, status) {
        if (!userId || !status) {
            throw new Error('userId và status là bắt buộc');
        }

        let conn;
        try {
            conn = await db.getConnection();
            console.log('Đang cập nhật trạng thái cho user:', userId, 'thành', status);
            
            const result = await conn.execute(
                'UPDATE users SET status = ? WHERE id = ?',
                [status, userId]
            );
            
            console.log('Kết quả cập nhật:', result);
            return result && result[0] && result[0].affectedRows > 0;
        } catch (error) {
            console.error('Lỗi SQL khi cập nhật trạng thái:', error);
            throw error;
        } finally {
            if (conn) {
                conn.release();
            }
        }
    }
    
    // Tìm kiếm người dùng
    static async search(keyword, currentUserId) {
        const conn = await db.getConnection();
        try {
            const [users] = await conn.query(
                `SELECT id, username, fullname, avatar, status 
                 FROM users 
                 WHERE (username LIKE ? OR fullname LIKE ?) AND id != ?
                 LIMIT 20`,
                [`%${keyword}%`, `%${keyword}%`, currentUserId]
            );
            return users;
        } finally {
            conn.release();
        }
    }
}

module.exports = User;