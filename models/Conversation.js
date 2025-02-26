const db = require('../config/db');

class Conversation {
    // Tạo cuộc trò chuyện mới
    static async create(name, type = 'private') {
        try {
            const conn = await db.getConnection();
            const result = await conn.query(
                'INSERT INTO conversations (name, type) VALUES (?, ?)',
                [name, type]
            );
            conn.release();
            
            return result.insertId;
        } catch (error) {
            console.error('Lỗi tạo cuộc trò chuyện:', error);
            throw error;
        }
    }
    
    // Thêm thành viên vào cuộc trò chuyện
    static async addMember(conversationId, userId) {
        try {
            const conn = await db.getConnection();
            await conn.query(
                'INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)',
                [conversationId, userId]
            );
            conn.release();
            
            return true;
        } catch (error) {
            console.error('Lỗi thêm thành viên vào cuộc trò chuyện:', error);
            throw error;
        }
    }
    
    // Lấy cuộc trò chuyện theo ID
    static async findById(id) {
        try {
            const conn = await db.getConnection();
            const conversations = await conn.query(
                'SELECT * FROM conversations WHERE id = ?',
                [id]
            );
            conn.release();
            
            return conversations.length > 0 ? conversations[0] : null;
        } catch (error) {
            console.error('Lỗi lấy cuộc trò chuyện theo ID:', error);
            throw error;
        }
    }
    
    // Lấy danh sách cuộc trò chuyện của người dùng
    static async findByUserId(userId) {
        try {
            const conn = await db.getConnection();
            const conversations = await conn.query(`
                SELECT c.*, 
                       (SELECT COUNT(*) FROM conversation_members WHERE conversation_id = c.id) as member_count,
                       (SELECT MAX(created_at) FROM messages WHERE conversation_id = c.id) as last_message_time
                FROM conversations c
                JOIN conversation_members cm ON c.id = cm.conversation_id
                WHERE cm.user_id = ?
                ORDER BY last_message_time DESC
            `, [userId]);
            conn.release();
            
            return conversations;
        } catch (error) {
            console.error('Lỗi lấy danh sách cuộc trò chuyện:', error);
            throw error;
        }
    }
    
    // Kiểm tra người dùng có trong cuộc trò chuyện không
    static async isMember(conversationId, userId) {
        try {
            const conn = await db.getConnection();
            const result = await conn.query(
                'SELECT * FROM conversation_members WHERE conversation_id = ? AND user_id = ?',
                [conversationId, userId]
            );
            conn.release();
            
            return result.length > 0;
        } catch (error) {
            console.error('Lỗi kiểm tra thành viên cuộc trò chuyện:', error);
            throw error;
        }
    }
    
    // Lấy danh sách thành viên của cuộc trò chuyện
    static async getMembers(conversationId) {
        try {
            const conn = await db.getConnection();
            const members = await conn.query(`
                SELECT u.id, u.username, u.fullname, u.avatar, u.status
                FROM conversation_members cm
                JOIN users u ON cm.user_id = u.id
                WHERE cm.conversation_id = ?
            `, [conversationId]);
            conn.release();
            
            return members;
        } catch (error) {
            console.error('Lỗi lấy danh sách thành viên cuộc trò chuyện:', error);
            throw error;
        }
    }
}

module.exports = Conversation;