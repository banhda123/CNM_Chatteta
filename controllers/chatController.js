const db = require('../config/db');

// Lấy danh sách cuộc trò chuyện của user
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.userId;
        const conn = await db.getConnection();
        
        const conversations = await conn.query(`
            SELECT c.*, 
                   (SELECT COUNT(*) FROM conversation_members WHERE conversation_id = c.id) as member_count,
                   (SELECT MAX(created_at) FROM messages WHERE conversation_id = c.id) as last_message_time,
                   (SELECT GROUP_CONCAT(u.username SEPARATOR ', ') 
                    FROM conversation_members cm 
                    JOIN users u ON cm.user_id = u.id 
                    WHERE cm.conversation_id = c.id AND cm.user_id != ?) as members_list
            FROM conversations c
            JOIN conversation_members cm ON c.id = cm.conversation_id
            WHERE cm.user_id = ?
            ORDER BY last_message_time DESC
        `, [userId, userId]);
        
        // Lấy tin nhắn cuối cùng cho mỗi cuộc trò chuyện
        for (let i = 0; i < conversations.length; i++) {
            const lastMessages = await conn.query(`
                SELECT m.*, u.username as sender_name
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.conversation_id = ?
                ORDER BY m.created_at DESC
                LIMIT 1
            `, [conversations[i].id]);
            
            conversations[i].last_message = lastMessages.length > 0 ? lastMessages[0] : null;
        }
        
        conn.release();
        res.json({
            success: true,
            conversations
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách cuộc trò chuyện:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Lấy tin nhắn của một cuộc trò chuyện
exports.getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.userId;
        const { page = 1, limit = 20 } = req.query;
        
        const offset = (page - 1) * limit;
        
        const conn = await db.getConnection();
        
        // Kiểm tra người dùng có trong cuộc trò chuyện không
        const memberCheck = await conn.query(
            'SELECT * FROM conversation_members WHERE conversation_id = ? AND user_id = ?',
            [conversationId, userId]
        );
        
        if (memberCheck.length === 0) {
            conn.release();
            return res.status(403).json({ message: 'Bạn không có quyền truy cập cuộc trò chuyện này' });
        }
        
        // Lấy thông tin cuộc trò chuyện
        const conversations = await conn.query(
            'SELECT * FROM conversations WHERE id = ?',
            [conversationId]
        );
        
        if (conversations.length === 0) {
            conn.release();
            return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
        }
        
        // Lấy danh sách thành viên
        const members = await conn.query(`
            SELECT u.id, u.username, u.fullname, u.avatar, u.status
            FROM conversation_members cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.conversation_id = ?
        `, [conversationId]);
        
        // Lấy tin nhắn
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
        
        const totalMessages = countResult[0].total;
        const totalPages = Math.ceil(totalMessages / limit);
        
        conn.release();
        
        res.json({
            success: true,
            conversation: {
                ...conversations[0],
                members
            },
            messages: messages.reverse(),
            pagination: {
                total: totalMessages,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages
            }
        });
    } catch (error) {
        console.error('Lỗi lấy tin nhắn:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Tạo cuộc trò chuyện mới
exports.createConversation = async (req, res) => {
    try {
        const { name, members, type = 'private' } = req.body;
        const userId = req.user.userId;
        
        if (!members || !Array.isArray(members) || members.length === 0) {
            return res.status(400).json({ message: 'Vui lòng chọn ít nhất một người để trò chuyện' });
        }
        
        const conn = await db.getConnection();
        
        // Kiểm tra xem đã có cuộc trò chuyện riêng tư giữa 2 người chưa
        if (type === 'private' && members.length === 1) {
            const existingConversation = await conn.query(`
                SELECT c.id FROM conversations c
                JOIN conversation_members cm1 ON c.id = cm1.conversation_id
                JOIN conversation_members cm2 ON c.id = cm2.conversation_id
                WHERE c.type = 'private'
                AND cm1.user_id = ?
                AND cm2.user_id = ?
                AND (SELECT COUNT(*) FROM conversation_members WHERE conversation_id = c.id) = 2
            `, [userId, members[0]]);
            
            if (existingConversation.length > 0) {
                conn.release();
                return res.json({
                    success: true,
                    message: 'Đã có cuộc trò chuyện',
                    conversationId: existingConversation[0].id,
                    isExisting: true
                });
            }
        }
        
        // Tạo cuộc trò chuyện mới
        let conversationName = name;
        
        // Nếu không có tên, lấy tên của thành viên (cho chat riêng tư)
        if (!conversationName && type === 'private') {
            const memberInfo = await conn.query(
                'SELECT fullname FROM users WHERE id = ?',
                [members[0]]
            );
            
            if (memberInfo.length > 0) {
                conversationName = memberInfo[0].fullname;
            }
        }
        
        // Tạo cuộc trò chuyện
        const result = await conn.query(
            'INSERT INTO conversations (name, type) VALUES (?, ?)',
            [conversationName, type]
        );
        
        const conversationId = result.insertId;
        
        // Thêm người tạo vào cuộc trò chuyện
        await conn.query(
            'INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)',
            [conversationId, userId]
        );
        
        // Thêm các thành viên khác
        for (const memberId of members) {
            await conn.query(
                'INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)',
                [conversationId, memberId]
            );
        }
        
        conn.release();
        
        res.status(201).json({
            success: true,
            message: 'Tạo cuộc trò chuyện thành công',
            conversationId,
            isExisting: false
        });
    } catch (error) {
        console.error('Lỗi tạo cuộc trò chuyện:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Gửi tin nhắn
exports.sendMessage = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { content, type = 'text' } = req.body;
        const userId = req.user.userId;
        
        // Kiểm tra dữ liệu đầu vào
        if (!content && type === 'text') {
            return res.status(400).json({ message: 'Nội dung tin nhắn không được để trống' });
        }
        
        const conn = await db.getConnection();
        
        // Kiểm tra người dùng có trong cuộc trò chuyện không
        const memberCheck = await conn.query(
            'SELECT * FROM conversation_members WHERE conversation_id = ? AND user_id = ?',
            [conversationId, userId]
        );
        
        if (memberCheck.length === 0) {
            conn.release();
            return res.status(403).json({ message: 'Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này' });
        }
        
        // Lưu tin nhắn
        let fileUrl = null;
        if (req.file && (type === 'image' || type === 'file' || type === 'video')) {
            fileUrl = req.file.path.replace(/\\/g, '/');
        }
        
        const result = await conn.query(
            'INSERT INTO messages (conversation_id, sender_id, content, type, file_url) VALUES (?, ?, ?, ?, ?)',
            [conversationId, userId, content, type, fileUrl]
        );
        
        // Lấy thông tin tin nhắn vừa tạo
        const messages = await conn.query(`
            SELECT m.*, u.username as sender_name, u.avatar as sender_avatar
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.id = ?
        `, [result.insertId]);
        
        conn.release();
        
        const message = messages[0];
        
        // Trả về kết quả
        res.status(201).json({
            success: true,
            message: 'Gửi tin nhắn thành công',
            data: message
        });
        
        // Thông báo qua Socket.IO sẽ được xử lý ở socketService
        
    } catch (error) {
        console.error('Lỗi gửi tin nhắn:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Thêm thành viên vào cuộc trò chuyện nhóm
exports.addMember = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { memberId } = req.body;
        const userId = req.user.userId;
        
        const conn = await db.getConnection();
        
        // Kiểm tra người dùng có trong cuộc trò chuyện không
        const memberCheck = await conn.query(
            'SELECT * FROM conversation_members WHERE conversation_id = ? AND user_id = ?',
            [conversationId, userId]
        );
        
        if (memberCheck.length === 0) {
            conn.release();
            return res.status(403).json({ message: 'Bạn không có quyền thêm thành viên vào cuộc trò chuyện này' });
        }
        
        // Kiểm tra cuộc trò chuyện có phải là nhóm không
        const conversations = await conn.query(
            'SELECT * FROM conversations WHERE id = ?',
            [conversationId]
        );
        
        if (conversations.length === 0) {
            conn.release();
            return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
        }
        
        if (conversations[0].type !== 'group') {
            conn.release();
            return res.status(400).json({ message: 'Chỉ có thể thêm thành viên vào cuộc trò chuyện nhóm' });
        }
        
        // Kiểm tra thành viên đã trong nhóm chưa
        const existingMember = await conn.query(
            'SELECT * FROM conversation_members WHERE conversation_id = ? AND user_id = ?',
            [conversationId, memberId]
        );
        
        if (existingMember.length > 0) {
            conn.release();
            return res.status(400).json({ message: 'Thành viên đã trong nhóm' });
        }
        
        // Thêm thành viên
        await conn.query(
            'INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)',
            [conversationId, memberId]
        );
        
        // Lấy thông tin thành viên
        const members = await conn.query(
            'SELECT id, username, fullname, avatar FROM users WHERE id = ?',
            [memberId]
        );
        
        conn.release();
        
        res.json({
            success: true,
            message: 'Thêm thành viên thành công',
            member: members[0]
        });
        
    } catch (error) {
        console.error('Lỗi thêm thành viên:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Rời khỏi cuộc trò chuyện
exports.leaveConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.userId;
        
        const conn = await db.getConnection();
        
        // Kiểm tra người dùng có trong cuộc trò chuyện không
        const memberCheck = await conn.query(
            'SELECT * FROM conversation_members WHERE conversation_id = ? AND user_id = ?',
            [conversationId, userId]
        );
        
        if (memberCheck.length === 0) {
            conn.release();
            return res.status(403).json({ message: 'Bạn không trong cuộc trò chuyện này' });
        }
        
        // Xóa thành viên
        await conn.query(
            'DELETE FROM conversation_members WHERE conversation_id = ? AND user_id = ?',
            [conversationId, userId]
        );
        
        // Kiểm tra xem còn thành viên nào không
        const remainingMembers = await conn.query(
            'SELECT COUNT(*) as count FROM conversation_members WHERE conversation_id = ?',
            [conversationId]
        );
        
        // Nếu không còn ai, xóa cuộc trò chuyện
        if (remainingMembers[0].count === 0) {
            await conn.query(
                'DELETE FROM conversations WHERE id = ?',
                [conversationId]
            );
        }
        
        conn.release();
        
        res.json({
            success: true,
            message: 'Đã rời khỏi cuộc trò chuyện'
        });
        
    } catch (error) {
        console.error('Lỗi rời cuộc trò chuyện:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};