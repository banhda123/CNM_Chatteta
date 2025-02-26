const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// Lấy danh sách cuộc trò chuyện của user
router.get('/conversations', auth, async (req, res) => {
    try {
        const conn = await db.getConnection();
        const [conversations] = await conn.query(`
            SELECT c.*, 
                   GROUP_CONCAT(u.username) as members
            FROM conversations c
            JOIN conversation_members cm ON c.id = cm.conversation_id
            JOIN users u ON cm.user_id = u.id
            WHERE c.id IN (
                SELECT conversation_id 
                FROM conversation_members 
                WHERE user_id = ?
            )
            GROUP BY c.id
        `, [req.user.userId]);
        
        conn.release();
        res.json(conversations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Lấy tin nhắn của một cuộc trò chuyện
router.get('/conversations/:id/messages', auth, async (req, res) => {
    try {
        const conn = await db.getConnection();
        const [messages] = await conn.query(`
            SELECT m.*, u.username, u.avatar
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.conversation_id = ?
            ORDER BY m.created_at DESC
            LIMIT 50
        `, [req.params.id]);
        
        conn.release();
        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Tạo cuộc trò chuyện mới
router.post('/conversations', auth, async (req, res) => {
    try {
        const { name, members, type } = req.body;
        const conn = await db.getConnection();
        
        // Tạo cuộc trò chuyện
        const [result] = await conn.query(
            'INSERT INTO conversations (name, type) VALUES (?, ?)',
            [name, type || 'private']
        );
        
        const conversationId = result.insertId;
        
        // Thêm thành viên vào cuộc trò chuyện
        const memberValues = [req.user.userId, ...members].map(
            userId => [conversationId, userId]
        );
        
        await conn.batch(
            'INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)',
            memberValues
        );
        
        conn.release();
        res.status(201).json({ id: conversationId, message: 'Tạo cuộc trò chuyện thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Gửi tin nhắn
router.post('/conversations/:id/messages', auth, async (req, res) => {
    try {
        const { content, type } = req.body;
        const conversationId = req.params.id;
        const senderId = req.user.userId;
        
        const conn = await db.getConnection();
        
        // Kiểm tra người dùng có trong cuộc trò chuyện không
        const [memberCheck] = await conn.query(
            'SELECT * FROM conversation_members WHERE conversation_id = ? AND user_id = ?',
            [conversationId, senderId]
        );
        
        if (memberCheck.length === 0) {
            conn.release();
            return res.status(403).json({ message: 'Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này' });
        }
        
        // Lưu tin nhắn
        const [result] = await conn.query(
            'INSERT INTO messages (conversation_id, sender_id, content, type) VALUES (?, ?, ?, ?)',
            [conversationId, senderId, content, type || 'text']
        );
        
        // Lấy thông tin tin nhắn vừa tạo
        const [messages] = await conn.query(`
            SELECT m.*, u.username, u.avatar
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.id = ?
        `, [result.insertId]);
        
        conn.release();
        
        res.status(201).json({
            success: true,
            message: 'Gửi tin nhắn thành công',
            data: messages[0]
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;