const db = require('../config/db');

const handleError = (res, error, message = 'Lỗi server') => {
  console.error(message, error);
  res.status(500).json({ message });
};

const getConnection = async () => {
  const conn = await db.getConnection();
  return conn;
};

const checkMembership = async (conn, conversationId, userId) => {
  const memberCheck = await conn.query(
    'SELECT 1 FROM conversation_members WHERE conversation_id = ? AND user_id = ?',
    [conversationId, userId]
  );
  return memberCheck.length > 0;
};

// Lấy danh sách cuộc trò chuyện
exports.getConversations = async (req, res) => {
  const conn = await getConnection();
  try {
    const userId = req.user.userId;
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

    for (const conv of conversations) {
      const [lastMessage] = await conn.query(`
        SELECT m.*, u.username as sender_name
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
        ORDER BY m.created_at DESC
        LIMIT 1
      `, [conv.id]);
      conv.last_message = lastMessage || null;
    }

    res.json({ success: true, conversations });
  } catch (error) {
    handleError(res, error, 'Lỗi lấy danh sách cuộc trò chuyện:');
  } finally {
    conn.release();
  }
};

// Lấy tin nhắn của cuộc trò chuyện
exports.getMessages = async (req, res) => {
  const conn = await getConnection();
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.userId;
    const offset = (page - 1) * limit;

    if (!(await checkMembership(conn, conversationId, userId))) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập cuộc trò chuyện này' });
    }

    const [conversation] = await conn.query('SELECT * FROM conversations WHERE id = ?', [conversationId]);
    if (!conversation) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    }

    const members = await conn.query(`
      SELECT u.id, u.username, u.fullname, u.avatar, u.status
      FROM conversation_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.conversation_id = ?
    `, [conversationId]);

    const messages = await conn.query(`
      SELECT m.*, u.username as sender_name, u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `, [conversationId, +limit, +offset]);

    const [{ total }] = await conn.query('SELECT COUNT(*) as total FROM messages WHERE conversation_id = ?', [conversationId]);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      conversation: { ...conversation, members },
      messages: messages.reverse(),
      pagination: { total, page: +page, limit: +limit, totalPages }
    });
  } catch (error) {
    handleError(res, error, 'Lỗi lấy tin nhắn:');
  } finally {
    conn.release();
  }
};

// Tạo cuộc trò chuyện mới
exports.createConversation = async (req, res) => {
  const conn = await getConnection();
  try {
    const { name, members, type = 'private' } = req.body;
    const userId = req.user.userId;

    if (!members?.length) {
      return res.status(400).json({ message: 'Vui lòng chọn ít nhất một người để trò chuyện' });
    }

    if (type === 'private' && members.length === 1) {
      const [existing] = await conn.query(`
        SELECT c.id FROM conversations c
        JOIN conversation_members cm1 ON c.id = cm1.conversation_id
        JOIN conversation_members cm2 ON c.id = cm2.conversation_id
        WHERE c.type = 'private'
        AND cm1.user_id = ? AND cm2.user_id = ?
        AND (SELECT COUNT(*) FROM conversation_members WHERE conversation_id = c.id) = 2
      `, [userId, members[0]]);
      if (existing) {
        return res.json({ success: true, message: 'Đã có cuộc trò chuyện', conversationId: existing.id, isExisting: true });
      }
    }

    let conversationName = name;
    if (!conversationName && type === 'private') {
      const [{ fullname = '' } = {}] = await conn.query('SELECT fullname FROM users WHERE id = ?', [members[0]]);
      conversationName = fullname;
    }

    const { insertId: conversationId } = await conn.query('INSERT INTO conversations (name, type) VALUES (?, ?)', [conversationName, type]);
    await conn.query('INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)', [conversationId, userId]);
    for (const memberId of members) {
      await conn.query('INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)', [conversationId, memberId]);
    }

    res.status(201).json({ success: true, message: 'Tạo cuộc trò chuyện thành công', conversationId, isExisting: false });
  } catch (error) {
    handleError(res, error, 'Lỗi tạo cuộc trò chuyện:');
  } finally {
    conn.release();
  }
};

// Gửi tin nhắn
exports.sendMessage = async (req, res) => {
  const conn = await getConnection();
  try {
    const { conversationId } = req.params;
    const { content, type = 'text' } = req.body;
    const userId = req.user.userId;

    if (!content && type === 'text') {
      return res.status(400).json({ message: 'Nội dung tin nhắn không được để trống' });
    }

    if (!(await checkMembership(conn, conversationId, userId))) {
      return res.status(403).json({ message: 'Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này' });
    }

    const fileUrl = req.file && ['image', 'file', 'video'].includes(type) ? req.file.path.replace(/\\/g, '/') : null;
    const { insertId } = await conn.query(
      'INSERT INTO messages (conversation_id, sender_id, content, type, file_url) VALUES (?, ?, ?, ?, ?)',
      [conversationId, userId, content, type, fileUrl]
    );

    const [message] = await conn.query(`
      SELECT m.*, u.username as sender_name, u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `, [insertId]);

    res.status(201).json({ success: true, message: 'Gửi tin nhắn thành công', data: message });
  } catch (error) {
    handleError(res, error, 'Lỗi gửi tin nhắn:');
  } finally {
    conn.release();
  }
};

// Thêm thành viên vào cuộc trò chuyện nhóm
exports.addMember = async (req, res) => {
  const conn = await getConnection();
  try {
    const { conversationId } = req.params;
    const { memberId } = req.body;
    const userId = req.user.userId;

    if (!(await checkMembership(conn, conversationId, userId))) {
      return res.status(403).json({ message: 'Bạn không có quyền thêm thành viên vào cuộc trò chuyện này' });
    }

    const [conversation] = await conn.query('SELECT * FROM conversations WHERE id = ?', [conversationId]);
    if (!conversation) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    }
    if (conversation.type !== 'group') {
      return res.status(400).json({ message: 'Chỉ có thể thêm thành viên vào cuộc trò chuyện nhóm' });
    }

    if ((await checkMembership(conn, conversationId, memberId))) {
      return res.status(400).json({ message: 'Thành viên đã trong nhóm' });
    }

    await conn.query('INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)', [conversationId, memberId]);
    const [member] = await conn.query('SELECT id, username, fullname, avatar FROM users WHERE id = ?', [memberId]);

    res.json({ success: true, message: 'Thêm thành viên thành công', member });
  } catch (error) {
    handleError(res, error, 'Lỗi thêm thành viên:');
  } finally {
    conn.release();
  }
};

// Rời khỏi cuộc trò chuyện
exports.leaveConversation = async (req, res) => {
  const conn = await getConnection();
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;

    if (!(await checkMembership(conn, conversationId, userId))) {
      return res.status(403).json({ message: 'Bạn không trong cuộc trò chuyện này' });
    }

    await conn.query('DELETE FROM conversation_members WHERE conversation_id = ? AND user_id = ?', [conversationId, userId]);
    const [{ count }] = await conn.query('SELECT COUNT(*) as count FROM conversation_members WHERE conversation_id = ?', [conversationId]);
    if (count === 0) {
      await conn.query('DELETE FROM conversations WHERE id = ?', [conversationId]);
    }

    res.json({ success: true, message: 'Đã rời khỏi cuộc trò chuyện' });
  } catch (error) {
    handleError(res, error, 'Lỗi rời cuộc trò chuyện:');
  } finally {
    conn.release();
  }
};