const db = require('../config/db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const handleError = (res, error, msg = 'Lỗi server') => {
  console.error(msg, error);
  res.status(500).json({ message: msg });
};

const checkFriendship = async (conn, userId, targetId) => {
  const [friendCheck] = await conn.query(
    'SELECT 1 FROM friends WHERE ((user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)) AND status = "accepted"',
    [userId, targetId, targetId, userId]
  );
  return friendCheck.length > 0;
};

exports.getUserProfile = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const userId = req.params.id || req.user.userId;
    const [user] = await conn.query(
      'SELECT id, username, fullname, avatar, status, created_at FROM users WHERE id = ?',
      [userId]
    );
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    let isFriend = false, friendRequest = null;
    if (req.user && req.user.userId != userId) {
      isFriend = await checkFriendship(conn, req.user.userId, userId);
      const [request] = await conn.query(
        'SELECT id, status, sender_id, receiver_id, created_at FROM friend_requests WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)',
        [req.user.userId, userId, userId, req.user.userId]
      );
      friendRequest = request || null;
    }
    res.json({ success: true, user, isFriend, friendRequest });
  } catch (error) {
    handleError(res, error, 'Lỗi lấy thông tin người dùng:');
  } finally {
    conn.release();
  }
};

exports.updateProfile = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { userId } = req.user;
    const { fullname } = req.body;
    await conn.query('UPDATE users SET fullname = ? WHERE id = ?', [fullname, userId]);
    const [user] = await conn.query('SELECT id, username, fullname, avatar, status FROM users WHERE id = ?', [userId]);
    res.json({ success: true, message: 'Cập nhật thông tin thành công', user });
  } catch (error) {
    handleError(res, error, 'Lỗi cập nhật thông tin:');
  } finally {
    conn.release();
  }
};

exports.updateAvatar = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { userId } = req.user;
    if (!req.file) return res.status(400).json({ message: 'Vui lòng chọn ảnh đại diện' });
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    const [{ avatar: oldAvatar } = {}] = await conn.query('SELECT avatar FROM users WHERE id = ?', [userId]);
    await conn.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarPath, userId]);
    
    if (oldAvatar && fs.existsSync(path.join(__dirname, '..', oldAvatar))) {
      fs.unlinkSync(path.join(__dirname, '..', oldAvatar));
    }
    const [user] = await conn.query('SELECT id, username, fullname, avatar, status FROM users WHERE id = ?', [userId]);
    res.json({ success: true, message: 'Cập nhật ảnh đại diện thành công', user });
  } catch (error) {
    handleError(res, error, 'Lỗi cập nhật avatar:');
  } finally {
    conn.release();
  }
};

exports.changePassword = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { userId } = req.user;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });

    const [{ password }] = await conn.query('SELECT password FROM users WHERE id = ?', [userId]);
    if (!password || !await bcrypt.compare(currentPassword, password)) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await conn.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    handleError(res, error, 'Lỗi đổi mật khẩu:');
  } finally {
    conn.release();
  }
};

exports.searchUsers = async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const { q } = req.query;
    const { userId } = req.user;
    
    // If search query is empty or too short, return empty results
    if (!q || q.trim().length < 2) {
      return res.json({ 
        success: true, 
        users: [],
        message: 'Từ khóa tìm kiếm phải có ít nhất 2 ký tự' 
      });
    }
    
    console.log(`Searching users with keyword: ${q}`);
    
    const [users] = await conn.query(`
      SELECT u.id, u.username, u.fullname, u.avatar, u.status,
        CASE
          WHEN f.id IS NOT NULL THEN 'friend'
          WHEN fr_sent.id IS NOT NULL THEN 'sent_request'
          WHEN fr_received.id IS NOT NULL THEN 'received_request'
          ELSE 'none'
        END as relationship
      FROM users u
      LEFT JOIN friends f ON (f.user_id = ? AND f.friend_id = u.id) OR (f.user_id = u.id AND f.friend_id = ?)
      LEFT JOIN friend_requests fr_sent ON fr_sent.sender_id = ? AND fr_sent.receiver_id = u.id AND fr_sent.status = 'pending'
      LEFT JOIN friend_requests fr_received ON fr_received.receiver_id = ? AND fr_received.sender_id = u.id AND fr_received.status = 'pending'
      WHERE u.id != ? AND (u.username LIKE ? OR u.fullname LIKE ?)
      ORDER BY 
        CASE 
          WHEN relationship = 'friend' THEN 1
          WHEN relationship = 'received_request' THEN 2
          WHEN relationship = 'sent_request' THEN 3
          ELSE 4
        END, u.username
      LIMIT 20
    `, [userId, userId, userId, userId, userId, `%${q}%`, `%${q}%`]);
    
    console.log(`Found ${users.length} users matching keyword: ${q}`);
    
    // Ensure users is always an array
    if (!Array.isArray(users)) {
      console.log('Search results are not an array, converting to array:', users);
      res.json({ success: true, users: users ? [users] : [] });
    } else {
      res.json({ success: true, users });
    }
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi tìm kiếm người dùng', 
      error: error.message 
    });
  } finally {
    if (conn) conn.release();
  }
};

exports.sendFriendRequest = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { receiverId } = req.body;
    const { userId } = req.user;
    if (userId == receiverId) return res.status(400).json({ message: 'Không thể gửi lời mời kết bạn cho chính mình' });
    const [receiver] = await conn.query('SELECT 1 FROM users WHERE id = ?', [receiverId]);
    if (!receiver) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    if (await checkFriendship(conn, userId, receiverId)) return res.status(400).json({ message: 'Đã là bạn bè' });
    const [request] = await conn.query(
      'SELECT id, sender_id, status FROM friend_requests WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)',
      [userId, receiverId, receiverId, userId]
    );
    if (request) {
      if (request.sender_id == receiverId && request.status === 'pending') {
        await conn.query('UPDATE friend_requests SET status = ? WHERE id = ?', ['accepted', request.id]);
        await conn.query('INSERT INTO friends (user_id1, user_id2) VALUES (?, ?), (?, ?)', [userId, receiverId, receiverId, userId]);
        return res.json({ success: true, message: 'Đã chấp nhận lời mời kết bạn', status: 'accepted' });
      }
      return res.status(400).json({ message: 'Đã gửi lời mời kết bạn trước đó' });
    }
    const { insertId } = await conn.query(
      'INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES (?, ?, ?)',
      [userId, receiverId, 'pending']
    );
    res.status(201).json({ success: true, message: 'Đã gửi lời mời kết bạn', requestId: insertId, status: 'pending' });
  } catch (error) {
    handleError(res, error, 'Lỗi gửi lời mời kết bạn:');
  } finally {
    conn.release();
  }
};

exports.respondFriendRequest = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { requestId } = req.params;
    const { action } = req.body;
    const { userId } = req.user;
    if (!['accept', 'reject'].includes(action)) return res.status(400).json({ message: 'Hành động không hợp lệ' });
    const [request] = await conn.query(
      'SELECT sender_id FROM friend_requests WHERE id = ? AND receiver_id = ? AND status = ?',
      [requestId, userId, 'pending']
    );
    if (!request) return res.status(404).json({ message: 'Không tìm thấy lời mời kết bạn' });

    const status = action === 'accept' ? 'accepted' : 'rejected';
    await conn.query('UPDATE friend_requests SET status = ? WHERE id = ?', [status, requestId]);
    if (action === 'accept') {
      await conn.query('INSERT INTO friends (user_id1, user_id2) VALUES (?, ?), (?, ?)', [userId, request.sender_id, request.sender_id, userId]);
    }
    res.json({ success: true, message: `Đã ${action === 'accept' ? 'chấp nhận' : 'từ chối'} lời mời kết bạn` });
  } catch (error) {
    handleError(res, error, 'Lỗi phản hồi lời mời kết bạn:');
  } finally {
    conn.release();
  }
};

exports.getFriends = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const friends = await conn.query(`
      SELECT u.id, u.username, u.fullname, u.avatar, u.status
      FROM friends f
      JOIN users u ON f.user_id2 = u.id
      WHERE f.user_id1 = ?
      ORDER BY u.fullname
    `, [req.user.userId]);
    res.json({ success: true, friends });
  } catch (error) {
    handleError(res, error, 'Lỗi lấy danh sách bạn bè:');
  } finally {
    conn.release();
  }
};

exports.getFriendRequests = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { userId } = req.user;
    const received = await conn.query(`
      SELECT fr.*, u.username, u.fullname, u.avatar
      FROM friend_requests fr
      JOIN users u ON fr.sender_id = u.id
      WHERE fr.receiver_id = ? AND fr.status = ?
      ORDER BY fr.created_at DESC
    `, [userId, 'pending']);
    const sent = await conn.query(`
      SELECT fr.*, u.username, u.fullname, u.avatar
      FROM friend_requests fr
      JOIN users u ON fr.receiver_id = u.id
      WHERE fr.sender_id = ? AND fr.status = ?
      ORDER BY fr.created_at DESC
    `, [userId, 'pending']);
    res.json({ success: true, received, sent });
  } catch (error) {
    handleError(res, error, 'Lỗi lấy danh sách lời mời kết bạn:');
  } finally {
    conn.release();
  }
};

exports.unfriend = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { friendId } = req.params;
    const { userId } = req.user;
    await conn.query(
      'DELETE FROM friends WHERE (user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)',
      [userId, friendId, friendId, userId]
    );
    await conn.query(
      'DELETE FROM friend_requests WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)',
      [userId, friendId, friendId, userId]
    );
    res.json({ success: true, message: 'Đã hủy kết bạn' });
  } catch (error) {
    handleError(res, error, 'Lỗi hủy kết bạn:');
  } finally {
    conn.release();
  }
};

// Lấy danh sách người dùng online
exports.getOnlineUsers = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const onlineUsers = await conn.query(`
      SELECT u.id, u.username, u.fullname, u.avatar
      FROM friends f
      JOIN users u ON f.user_id2 = u.id
      WHERE f.user_id1 = ? AND u.status = ?
      ORDER BY u.fullname
    `, [req.user.userId, 'online']);
    res.json({ success: true, onlineUsers });
  } catch (error) {
    handleError(res, error, 'Lỗi lấy danh sách người dùng online:');
  } finally {
    conn.release();
  }
};