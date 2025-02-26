const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    // Tìm người dùng theo ID
    static async findById(id) {
        try {
            const conn = await db.getConnection();
            const users = await conn.query(
                'SELECT * FROM users WHERE id = ?',
                [id]
            );
            conn.release();
            
            return users.length > 0 ? users[0] : null;
        } catch (error) {
            console.error('Lỗi tìm người dùng theo ID:', error);
            throw error;
        }
    }
    
    // Tìm người dùng theo username
    static async findByUsername(username) {
        try {
            const conn = await db.getConnection();
            const users = await conn.query(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );
            conn.release();
            
            return users.length > 0 ? users[0] : null;
        } catch (error) {
            console.error('Lỗi tìm người dùng theo username:', error);
            throw error;
        }
    }
    
    // Tạo người dùng mới
    static async create(userData) {
        try {
            const { username, password, fullname } = userData;
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const conn = await db.getConnection();
            const result = await conn.query(
                'INSERT INTO users (username, password, fullname) VALUES (?, ?, ?)',
                [username, hashedPassword, fullname]
            );
            conn.release();
            
            return result.insertId;
        } catch (error) {
            console.error('Lỗi tạo người dùng mới:', error);
            throw error;
        }
    }
    
    // Cập nhật trạng thái người dùng
    static async updateStatus(userId, status) {
        try {
            const conn = await db.getConnection();
            await conn.query(
                'UPDATE users SET status = ? WHERE id = ?',
                [status, userId]
            );
            conn.release();
            
            return true;
        } catch (error) {
            console.error('Lỗi cập nhật trạng thái người dùng:', error);
            throw error;
        }
    }
    

    static async search(keyword, currentUserId) {
        try {
            const conn = await db.getConnection();
            const users = await conn.query(
                `SELECT id, username, fullname, avatar, status 
                 FROM users 
                 WHERE (username LIKE ? OR fullname LIKE ?) AND id != ?
                 LIMIT 20`,
                [`%${keyword}%`, `%${keyword}%`, currentUserId]
            );
            
            conn.release();
            return users;
        } catch (error) {
            console.error('Lỗi tìm kiếm người dùng:', error);
            throw error;
        }
    }
}

module.exports = User;