const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');

// Validation rules
const messageValidation = [
    body('content')
        .trim()
        .notEmpty()
        .withMessage('Nội dung tin nhắn không được để trống')
        .isLength({ max: 1000 })
        .withMessage('Nội dung tin nhắn quá dài'),
    body('type')
        .isIn(['text', 'image', 'file'])
        .withMessage('Loại tin nhắn không hợp lệ')
];

const conversationValidation = [
    body('name')
        .trim()
        .isLength({ max: 100 })
        .withMessage('Tên cuộc trò chuyện quá dài'),
    body('type')
        .isIn(['private', 'group'])
        .withMessage('Loại cuộc trò chuyện không hợp lệ'),
    body('members')
        .isArray()
        .withMessage('Danh sách thành viên phải là mảng')
        .notEmpty()
        .withMessage('Danh sách thành viên không được để trống')
];

// Lấy danh sách cuộc trò chuyện của user
router.get('/conversations', auth, async (req, res) => {
    try {
        const conn = await db.getConnection();
        const [conversations] = await conn.query(`
            SELECT c.*, 
                   GROUP_CONCAT(u.username) as members,
                   COUNT(DISTINCT m.id) as message_count,
                   MAX(m.created_at) as last_message_time
            FROM conversations c
            JOIN conversation_members cm ON c.id = cm.conversation_id
            JOIN users u ON cm.user_id = u.id
            LEFT JOIN messages m ON c.id = m.conversation_id
            WHERE c.id IN (
                SELECT conversation_id 
                FROM conversation_members 
                WHERE user_id = ?
            )
            GROUP BY c.id
            ORDER BY last_message_time DESC
        `, [req.user.userId]);
        
        conn.release();
        res.json(conversations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Lấy tin nhắn của một cuộc trò chuyện
router.get('/conversations/:id/messages', 
    auth,
    param('id').isInt().withMessage('ID cuộc trò chuyện không hợp lệ'),
    query('page').optional().isInt({ min: 1 }).withMessage('Số trang không hợp lệ'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Số lượng tin nhắn không hợp lệ'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { id } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;

            const conn = await db.getConnection();
            
            // Kiểm tra quyền truy cập
            const [access] = await conn.query(
                'SELECT * FROM conversation_members WHERE conversation_id = ? AND user_id = ?',
                [id, req.user.userId]
            );
            
            if (access.length === 0) {
                conn.release();
                return res.status(403).json({ message: 'Bạn không có quyền truy cập cuộc trò chuyện này' });
            }

            const [messages] = await conn.query(`
                SELECT m.*, u.username, u.avatar
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.conversation_id = ?
                ORDER BY m.created_at DESC
                LIMIT ? OFFSET ?
            `, [id, limit, offset]);
            
            // Lấy tổng số tin nhắn
            const [total] = await conn.query(
                'SELECT COUNT(*) as total FROM messages WHERE conversation_id = ?',
                [id]
            );
            
            conn.release();
            res.json({
                messages,
                pagination: {
                    total: total[0].total,
                    page,
                    limit,
                    totalPages: Math.ceil(total[0].total / limit)
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server' });
        }
});

// Tạo cuộc trò chuyện mới
router.post('/conversations', auth, conversationValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, members, type } = req.body;
        const conn = await db.getConnection();
        
        // Kiểm tra các thành viên có tồn tại không
        const [users] = await conn.query(
            'SELECT id FROM users WHERE id IN (?)',
            [members]
        );
        
        if (users.length !== members.length) {
            conn.release();
            return res.status(400).json({ message: 'Một số thành viên không tồn tại' });
        }
        
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
        res.status(201).json({ 
            id: conversationId, 
            message: 'Tạo cuộc trò chuyện thành công' 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Gửi tin nhắn
router.post('/conversations/:id/messages', 
    auth,
    param('id').isInt().withMessage('ID cuộc trò chuyện không hợp lệ'),
    messageValidation,
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

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

// Tìm kiếm người dùng
router.get('/search', 
    auth,
    query('q').trim().notEmpty().withMessage('Từ khóa tìm kiếm không được để trống'),
    query('page').optional().isInt({ min: 1 }).withMessage('Số trang không hợp lệ'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Số lượng kết quả không hợp lệ'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { q, page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;
            
            const conn = await db.getConnection();
            
            // Tìm kiếm người dùng
            const [users] = await conn.query(`
                SELECT id, username, fullname, avatar
                FROM users 
                WHERE (username LIKE ? OR fullname LIKE ?)
                AND id != ?
                LIMIT ? OFFSET ?
            `, [`%${q}%`, `%${q}%`, req.user.userId, limit, offset]);
            
            // Lấy tổng số kết quả
            const [total] = await conn.query(`
                SELECT COUNT(*) as total
                FROM users 
                WHERE (username LIKE ? OR fullname LIKE ?)
                AND id != ?
            `, [`%${q}%`, `%${q}%`, req.user.userId]);
            
            conn.release();
            
            res.json({
                users,
                pagination: {
                    total: total[0].total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total[0].total / limit)
                }
            });
        } catch (error) {
            console.error('Lỗi tìm kiếm người dùng:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
});

module.exports = router;