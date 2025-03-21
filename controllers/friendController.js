const db = require('../config/db');

// Lấy danh sách bạn bè của người dùng
exports.getFriends = async (req, res) => {
    try {
        const userId = req.user.userId;
        const conn = await db.getConnection();
        
        const friends = await conn.query(`
            SELECT u.id, u.username, u.fullname, u.avatar, u.status
            FROM friends f
            JOIN users u ON (f.user_id = ? AND f.friend_id = u.id) OR (f.friend_id = ? AND f.user_id = u.id)
            ORDER BY u.username
        `, [userId, userId]);
        
        conn.release();
        res.json({
            success: true,
            friends
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách bạn bè:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Lấy danh sách lời mời kết bạn
exports.getFriendRequests = async (req, res) => {
    try {
        const userId = req.user.userId;
        const conn = await db.getConnection();
        
        // Lấy lời mời đã nhận
        const receivedRequests = await conn.query(`
            SELECT fr.id, fr.sender_id, fr.created_at, u.username, u.fullname, u.avatar
            FROM friend_requests fr
            JOIN users u ON fr.sender_id = u.id
            WHERE fr.receiver_id = ? AND fr.status = 'pending'
            ORDER BY fr.created_at DESC
        `, [userId]);
        
        // Lấy lời mời đã gửi
        const sentRequests = await conn.query(`
            SELECT fr.id, fr.receiver_id, fr.created_at, u.username, u.fullname, u.avatar
            FROM friend_requests fr
            JOIN users u ON fr.receiver_id = u.id
            WHERE fr.sender_id = ? AND fr.status = 'pending'
            ORDER BY fr.created_at DESC
        `, [userId]);
        
        conn.release();
        res.json({
            success: true,
            received: receivedRequests,
            sent: sentRequests
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách lời mời kết bạn:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Gửi lời mời kết bạn
exports.sendFriendRequest = async (req, res) => {
    try {
        const senderId = req.user.userId;
        const { receiverId } = req.body;
        
        if (!receiverId) {
            return res.status(400).json({ message: 'Thiếu thông tin người nhận' });
        }
        
        // Kiểm tra người dùng tồn tại
        const conn = await db.getConnection();
        const users = await conn.query('SELECT id FROM users WHERE id = ?', [receiverId]);
        
        if (users.length === 0) {
            conn.release();
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        
        // Kiểm tra đã là bạn bè chưa
        const friendCheck = await conn.query(
            'SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
            [senderId, receiverId, receiverId, senderId]
        );
        
        if (friendCheck.length > 0) {
            conn.release();
            return res.status(400).json({ message: 'Đã là bạn bè' });
        }
        
        // Kiểm tra đã gửi lời mời chưa
        const requestCheck = await conn.query(
            'SELECT * FROM friend_requests WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)',
            [senderId, receiverId, receiverId, senderId]
        );
        
        if (requestCheck.length > 0) {
            // Nếu đã có lời mời từ người nhận, tự động chấp nhận
            if (requestCheck[0].sender_id.toString() === receiverId.toString() && requestCheck[0].status === 'pending') {
                await conn.query(
                    'UPDATE friend_requests SET status = ? WHERE id = ?',
                    ['accepted', requestCheck[0].id]
                );
                
                // Thêm vào danh sách bạn bè
                await conn.query(
                    'INSERT INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)',
                    [senderId, receiverId, receiverId, senderId]
                );
                
                conn.release();
                return res.json({ 
                    success: true, 
                    message: 'Đã chấp nhận lời mời kết bạn', 
                    autoAccepted: true 
                });
            } else if (requestCheck[0].sender_id.toString() === senderId.toString()) {
                conn.release();
                return res.status(400).json({ message: 'Bạn đã gửi lời mời kết bạn cho người này rồi' });
            }
        }
        
        // Tạo lời mời kết bạn mới
        const result = await conn.query(
            'INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES (?, ?, ?)',
            [senderId, receiverId, 'pending']
        );
        
        conn.release();
        res.json({ 
            success: true, 
            message: 'Đã gửi lời mời kết bạn', 
            requestId: result.insertId 
        });
    } catch (error) {
        console.error('Lỗi gửi lời mời kết bạn:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Chấp nhận lời mời kết bạn
exports.acceptFriendRequest = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { requestId } = req.params;
        
        const conn = await db.getConnection();
        
        // Kiểm tra lời mời tồn tại và thuộc về người dùng
        const requests = await conn.query(
            'SELECT * FROM friend_requests WHERE id = ? AND receiver_id = ? AND status = ?',
            [requestId, userId, 'pending']
        );
        
        if (requests.length === 0) {
            conn.release();
            return res.status(404).json({ message: 'Không tìm thấy lời mời kết bạn' });
        }
        
        // Cập nhật trạng thái lời mời
        await conn.query(
            'UPDATE friend_requests SET status = ? WHERE id = ?',
            ['accepted', requestId]
        );
        
        const senderId = requests[0].sender_id;
        
        // Thêm vào danh sách bạn bè
        await conn.query(
            'INSERT INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)',
            [userId, senderId, senderId, userId]
        );
        
        conn.release();
        res.json({ 
            success: true, 
            message: 'Đã chấp nhận lời mời kết bạn' 
        });
    } catch (error) {
        console.error('Lỗi chấp nhận lời mời kết bạn:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Từ chối lời mời kết bạn
exports.rejectFriendRequest = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { requestId } = req.params;
        
        const conn = await db.getConnection();
        
        // Kiểm tra lời mời tồn tại và thuộc về người dùng
        const requests = await conn.query(
            'SELECT * FROM friend_requests WHERE id = ? AND receiver_id = ? AND status = ?',
            [requestId, userId, 'pending']
        );
        
        if (requests.length === 0) {
            conn.release();
            return res.status(404).json({ message: 'Không tìm thấy lời mời kết bạn' });
        }
        
        // Cập nhật trạng thái lời mời
        await conn.query(
            'UPDATE friend_requests SET status = ? WHERE id = ?',
            ['rejected', requestId]
        );
        
        conn.release();
        res.json({ 
            success: true, 
            message: 'Đã từ chối lời mời kết bạn' 
        });
    } catch (error) {
        console.error('Lỗi từ chối lời mời kết bạn:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Xóa bạn bè
exports.removeFriend = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { friendId } = req.params;
        
        const conn = await db.getConnection();
        
        // Kiểm tra có phải bạn bè không
        const friendCheck = await conn.query(
            'SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
            [userId, friendId, friendId, userId]
        );
        
        if (friendCheck.length === 0) {
            conn.release();
            return res.status(404).json({ message: 'Không tìm thấy bạn bè' });
        }
        
        // Xóa khỏi danh sách bạn bè
        await conn.query(
            'DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
            [userId, friendId, friendId, userId]
        );
        
        // Xóa lời mời kết bạn (nếu có)
        await conn.query(
            'DELETE FROM friend_requests WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)',
            [userId, friendId, friendId, userId]
        );
        
        conn.release();
        res.json({ 
            success: true, 
            message: 'Đã xóa bạn bè' 
        });
    } catch (error) {
        console.error('Lỗi xóa bạn bè:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Tìm kiếm người dùng
exports.searchUsers = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { keyword } = req.query;
        
        if (!keyword || keyword.trim().length < 2) {
            return res.status(400).json({ message: 'Từ khóa tìm kiếm phải có ít nhất 2 ký tự' });
        }
        
        const conn = await db.getConnection();
        
        // Tìm kiếm người dùng theo username hoặc fullname
        const users = await conn.query(`
            SELECT u.id, u.username, u.fullname, u.avatar, u.status,
                   CASE
                       WHEN f.user_id IS NOT NULL THEN 'friend'
                       WHEN fr_sent.id IS NOT NULL THEN 'sent_request'
                       WHEN fr_received.id IS NOT NULL THEN 'received_request'
                       ELSE 'none'
                   END as relationship
            FROM users u
            LEFT JOIN friends f ON (f.user_id = ? AND f.friend_id = u.id) OR (f.friend_id = ? AND f.user_id = u.id)
            LEFT JOIN friend_requests fr_sent ON fr_sent.sender_id = ? AND fr_sent.receiver_id = u.id AND fr_sent.status = 'pending'
            LEFT JOIN friend_requests fr_received ON fr_received.receiver_id = ? AND fr_received.sender_id = u.id AND fr_received.status = 'pending'
            WHERE u.id != ? AND (u.username LIKE ? OR u.fullname LIKE ?)
            ORDER BY
                CASE
                    WHEN relationship = 'friend' THEN 1
                    WHEN relationship = 'received_request' THEN 2
                    WHEN relationship = 'sent_request' THEN 3
                    ELSE 4
                END,
                u.username
            LIMIT 20
        `, [userId, userId, userId, userId, userId, `%${keyword}%`, `%${keyword}%`]);
        
        conn.release();
        res.json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Lỗi tìm kiếm người dùng:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};