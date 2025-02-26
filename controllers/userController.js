const db = require('../config/db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Lấy thông tin người dùng
exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.params.id || req.user.userId;
        
        const conn = await db.getConnection();
        const users = await conn.query(
            'SELECT id, username, fullname, avatar, status, created_at FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            conn.release();
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        
        // Kiểm tra xem có phải bạn bè không
        let isFriend = false;
        let friendRequest = null;
        
        if (req.user && req.user.userId !== parseInt(userId)) {
            // Kiểm tra bạn bè
            const friendCheck = await conn.query(
                'SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
                [req.user.userId, userId, userId, req.user.userId]
            );
            
            isFriend = friendCheck.length > 0;
            
            // Kiểm tra lời mời kết bạn
            const requestCheck = await conn.query(
                'SELECT * FROM friend_requests WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)',
                [req.user.userId, userId, userId, req.user.userId]
            );
            
            if (requestCheck.length > 0) {
                friendRequest = {
                    id: requestCheck[0].id,
                    status: requestCheck[0].status,
                    sender_id: requestCheck[0].sender_id,
                    receiver_id: requestCheck[0].receiver_id,
                    created_at: requestCheck[0].created_at
                };
            }
        }
        
        conn.release();
        
        res.json({
            success: true,
            user: users[0],
            isFriend,
            friendRequest
        });
    } catch (error) {
        console.error('Lỗi lấy thông tin người dùng:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Cập nhật thông tin người dùng
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { fullname } = req.body;
        
        const conn = await db.getConnection();
        
        // Cập nhật thông tin
        await conn.query(
            'UPDATE users SET fullname = ? WHERE id = ?',
            [fullname, userId]
        );
        
        // Lấy thông tin đã cập nhật
        const users = await conn.query(
            'SELECT id, username, fullname, avatar, status FROM users WHERE id = ?',
            [userId]
        );
        
        conn.release();
        
        res.json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            user: users[0]
        });
    } catch (error) {
        console.error('Lỗi cập nhật thông tin:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Cập nhật avatar
exports.updateAvatar = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        if (!req.file) {
            return res.status(400).json({ message: 'Vui lòng chọn ảnh đại diện' });
        }
        
        const avatarPath = req.file.path.replace(/\\/g, '/');
        
        const conn = await db.getConnection();
        
        // Lấy avatar cũ để xóa
        const users = await conn.query(
            'SELECT avatar FROM users WHERE id = ?',
            [userId]
        );
        
        // Cập nhật avatar mới
        await conn.query(
            'UPDATE users SET avatar = ? WHERE id = ?',
            [avatarPath, userId]
        );
        
        // Xóa avatar cũ nếu có
        if (users.length > 0 && users[0].avatar) {
            const oldAvatarPath = path.join(__dirname, '..', users[0].avatar);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }
        
        // Lấy thông tin đã cập nhật
        const updatedUsers = await conn.query(
            'SELECT id, username, fullname, avatar, status FROM users WHERE id = ?',
            [userId]
        );
        
        conn.release();
        
        res.json({
            success: true,
            message: 'Cập nhật ảnh đại diện thành công',
            user: updatedUsers[0]
        });
    } catch (error) {
        console.error('Lỗi cập nhật avatar:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Đổi mật khẩu
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
        }
        
        const conn = await db.getConnection();
        
        // Lấy thông tin người dùng
        const users = await conn.query(
            'SELECT password FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            conn.release();
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        
        // Kiểm tra mật khẩu hiện tại
        const validPassword = await bcrypt.compare(currentPassword, users[0].password);
        
        if (!validPassword) {
            conn.release();
            return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
        }
        
        // Mã hóa mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Cập nhật mật khẩu
        await conn.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, userId]
        );
        
        conn.release();
        
        res.json({
            success: true,
            message: 'Đổi mật khẩu thành công'
        });
    } catch (error) {
        console.error('Lỗi đổi mật khẩu:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Tìm kiếm người dùng
exports.searchUsers = async (req, res) => {
    try {
        const { keyword } = req.query;
        const userId = req.user.userId;
        
        if (!keyword) {
            return res.status(400).json({ message: 'Vui lòng nhập từ khóa tìm kiếm' });
        }
        
        const conn = await db.getConnection();
        
        const users = await conn.query(`
            SELECT id, username, fullname, avatar, status
            FROM users
            WHERE (username LIKE ? OR fullname LIKE ?) AND id != ?
            LIMIT 20
        `, [`%${keyword}%`, `%${keyword}%`, userId]);
        
        // Kiểm tra trạng thái bạn bè
        for (let i = 0; i < users.length; i++) {
            // Kiểm tra đã là bạn bè chưa
            const friendCheck = await conn.query(
                'SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
                [userId, users[i].id, users[i].id, userId]
            );
            
            users[i].isFriend = friendCheck.length > 0;
            
            // Kiểm tra có lời mời kết bạn không
            const requestCheck = await conn.query(
                'SELECT * FROM friend_requests WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)',
                [userId, users[i].id, users[i].id, userId]
            );
            
            if (requestCheck.length > 0) {
                users[i].friendRequest = {
                    id: requestCheck[0].id,
                    status: requestCheck[0].status,
                    sender_id: requestCheck[0].sender_id,
                    receiver_id: requestCheck[0].receiver_id
                };
            } else {
                users[i].friendRequest = null;
            }
        }
        
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

// Gửi lời mời kết bạn
exports.sendFriendRequest = async (req, res) => {
    try {
        const { receiverId } = req.body;
        const senderId = req.user.userId;
        
        if (senderId === parseInt(receiverId)) {
            return res.status(400).json({ message: 'Không thể gửi lời mời kết bạn cho chính mình' });
        }
        
        const conn = await db.getConnection();
        
        // Kiểm tra người nhận có tồn tại không
        const receiverCheck = await conn.query(
            'SELECT id FROM users WHERE id = ?',
            [receiverId]
        );
        
        if (receiverCheck.length === 0) {
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
        
        // Kiểm tra đã gửi lời mời kết bạn chưa
        const requestCheck = await conn.query(
            'SELECT * FROM friend_requests WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)',
            [senderId, receiverId, receiverId, senderId]
        );
        
        if (requestCheck.length > 0) {
            // Nếu đã có lời mời từ người nhận, tự động chấp nhận
            if (requestCheck[0].sender_id === parseInt(receiverId) && requestCheck[0].status === 'pending') {
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
                    status: 'accepted'
                });
            }
            
            conn.release();
            return res.status(400).json({ message: 'Đã gửi lời mời kết bạn trước đó' });
        }
        
        // Tạo lời mời kết bạn mới
        const result = await conn.query(
            'INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES (?, ?, ?)',
            [senderId, receiverId, 'pending']
        );
        
        conn.release();
        
        res.status(201).json({
            success: true,
            message: 'Đã gửi lời mời kết bạn',
            requestId: result.insertId,
            status: 'pending'
        });
    } catch (error) {
        console.error('Lỗi gửi lời mời kết bạn:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Phản hồi lời mời kết bạn
exports.respondFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { action } = req.body; // 'accept' hoặc 'reject'
        const userId = req.user.userId;
        
        if (!['accept', 'reject'].includes(action)) {
            return res.status(400).json({ message: 'Hành động không hợp lệ' });
        }
        
        const conn = await db.getConnection();
        
        // Kiểm tra lời mời kết bạn
        const requests = await conn.query(
            'SELECT * FROM friend_requests WHERE id = ? AND receiver_id = ? AND status = ?',
            [requestId, userId, 'pending']
        );
        
        if (requests.length === 0) {
            conn.release();
            return res.status(404).json({ message: 'Không tìm thấy lời mời kết bạn' });
        }
        
        const request = requests[0];
        
        if (action === 'accept') {
            // Cập nhật trạng thái lời mời
            await conn.query(
                'UPDATE friend_requests SET status = ? WHERE id = ?',
                ['accepted', requestId]
            );
            
            // Thêm vào danh sách bạn bè
            await conn.query(
                'INSERT INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)',
                [userId, request.sender_id, request.sender_id, userId]
            );
            
            conn.release();
            
            res.json({
                success: true,
                message: 'Đã chấp nhận lời mời kết bạn'
            });
        } else {
            // Từ chối lời mời
            await conn.query(
                'UPDATE friend_requests SET status = ? WHERE id = ?',
                ['rejected', requestId]
            );
            
            conn.release();
            
            res.json({
                success: true,
                message: 'Đã từ chối lời mời kết bạn'
            });
        }
    } catch (error) {
        console.error('Lỗi phản hồi lời mời kết bạn:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Lấy danh sách bạn bè
exports.getFriends = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const conn = await db.getConnection();
        
        const friends = await conn.query(`
            SELECT u.id, u.username, u.fullname, u.avatar, u.status
            FROM friends f
            JOIN users u ON f.friend_id = u.id
            WHERE f.user_id = ?
            ORDER BY u.fullname
        `, [userId]);
        
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
            SELECT fr.*, u.username, u.fullname, u.avatar
            FROM friend_requests fr
            JOIN users u ON fr.sender_id = u.id
            WHERE fr.receiver_id = ? AND fr.status = ?
            ORDER BY fr.created_at DESC
        `, [userId, 'pending']);
        
        // Lấy lời mời đã gửi
        const sentRequests = await conn.query(`
            SELECT fr.*, u.username, u.fullname, u.avatar
            FROM friend_requests fr
            JOIN users u ON fr.receiver_id = u.id
            WHERE fr.sender_id = ? AND fr.status = ?
            ORDER BY fr.created_at DESC
        `, [userId, 'pending']);
        
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

// Hủy kết bạn
exports.unfriend = async (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.user.userId;
        
        const conn = await db.getConnection();
        
        // Xóa khỏi danh sách bạn bè
        await conn.query(
            'DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
            [userId, friendId, friendId, userId]
        );
        
        // Xóa lời mời kết bạn nếu có
        await conn.query(
            'DELETE FROM friend_requests WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)',
            [userId, friendId, friendId, userId]
        );
        
        conn.release();
        
        res.json({
            success: true,
            message: 'Đã hủy kết bạn'
        });
    } catch (error) {
        console.error('Lỗi hủy kết bạn:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Lấy danh sách người dùng online
exports.getOnlineUsers = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const conn = await db.getConnection();
        
        const onlineFriends = await conn.query(`
            SELECT u.id, u.username, u.fullname, u.avatar
            FROM friends f
            JOIN users u ON f.friend_id = u.id
            WHERE f.user_id = ? AND u.status = ?
            ORDER BY u.fullname
        `, [userId, 'online']);
        
        conn.release();
        
        res.json({
            success: true,
            onlineUsers: onlineFriends
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách người dùng online:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};