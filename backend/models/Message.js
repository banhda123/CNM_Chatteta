const db = require('../config/db');

class Message {
    // Tạo tin nhắn mới
    static async create(conversationId, senderId, content, type = 'text', fileUrl = null) {
        try {
            const conn = await db.getConnection();
            const result = await conn.query(
                'INSERT INTO messages (conversation_id, sender_id, content, type, file_url) VALUES (?, ?, ?, ?, ?)',
                [conversationId, senderId, content, type, fileUrl]
            );
            conn.release();
            
            return result.insertId;
        } catch (error) {
            console.error('Lỗi tạo tin nhắn:', error);
            throw error;
        }
    }
    
    // Lấy tin nhắn theo ID
    static async findById(id) {
        try {
            const conn = await db.getConnection();
            const messages = await conn.query(`
                SELECT m.*, u.username as sender_name, u.avatar as sender_avatar
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.id = ?
            `, [id]);
            conn.release();
            
            return messages.length > 0 ? messages[0] : null;
        } catch (error) {
            console.error('Lỗi lấy tin nhắn theo ID:', error);
            throw error;
        }
    }
    
    // Lấy tin nhắn của cuộc trò chuyện
    static async findByConversationId(conversationId, page = 1, limit = 20) {
        try {
            const offset = (page - 1) * limit;
            
            const conn = await db.getConnection();
            const messages = await conn.query(`
                SELECT m.*, u.username as sender_name, u.avatar as sender_avatar
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.conversation_id = ?
                ORDER BY m.created_at DESC
                LIMIT ? OFFSET ?
            `, [conversationId, parseInt(limit), parseInt(offset)]);
            
            // Đếm tổng số tin nhắn
            const countResult = await conn.query(
                'SELECT COUNT(*) as total FROM messages WHERE conversation_id = ?',
                [conversationId]
            );
            
            conn.release();
            
            return {
                messages: messages.reverse(),
                total: countResult[0].total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(countResult[0].total / limit)
            };
        } catch (error) {
            console.error('Lỗi lấy tin nhắn của cuộc trò chuyện:', error);
            throw error;
        }
    }
    
    // Lấy tin nhắn cuối cùng của cuộc trò chuyện
    static async getLastMessage(conversationId) {
        try {
            const conn = await db.getConnection();
            const messages = await conn.query(`
                SELECT m.*, u.username as sender_name, u.avatar as sender_avatar
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.conversation_id = ?
                ORDER BY m.created_at DESC
                LIMIT 1
            `, [conversationId]);
            conn.release();
            
            return messages.length > 0 ? messages[0] : null;
        } catch (error) {
            console.error('Lỗi lấy tin nhắn cuối cùng:', error);
            throw error;
        }
    }
}

module.exports = Message;