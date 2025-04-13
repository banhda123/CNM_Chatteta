const db = require('../config/db');

const handleError = (res, error, msg = 'Lỗi server') => {
  console.error(msg, error);
  res.status(500).json({ message: msg });
};

// Lấy danh sách bạn bè
exports.getFriends = async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    console.log('Getting friends for user:', req.user.userId);
    
    const friendsResult = await conn.query(`
      SELECT u.id, u.username, u.fullname, u.avatar, u.status
      FROM friends f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = ?
      ORDER BY u.username
    `, [req.user.userId]);
    
    // Xử lý kết quả truy vấn MariaDB - đảm bảo là mảng
    let friends = [];
    
    if (friendsResult && friendsResult[0]) {
      friends = Array.isArray(friendsResult[0]) ? friendsResult[0] : [friendsResult[0]];
    }
    
    console.log(`Found ${friends.length} friends for user ${req.user.userId}`);
    console.log('Friends data type:', typeof friends, Array.isArray(friends));
    
    res.json({ success: true, friends: friends });
  } catch (error) {
    console.error('Error getting friends:', error);
    handleError(res, error, 'Lỗi lấy danh sách bạn bè:');
  } finally {
    if (conn) conn.release();
  }
};

// Lấy danh sách lời mời kết bạn
exports.getFriendRequests = async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const userId = req.user.userId;
    
    console.log('Getting friend requests for user:', userId);
    
    try {
      // Lấy lời mời nhận được
      console.log('Executing query for received requests...');
      const receivedResult = await conn.query(`
        SELECT fr.id, fr.sender_id, fr.created_at, fr.status
        FROM friend_requests fr
        WHERE fr.receiver_id = ? AND fr.status = 'pending'
        ORDER BY fr.created_at DESC
      `, [userId]);
      
      // Log kết quả chi tiết
      console.log('Raw received result:', JSON.stringify(receivedResult));
      
      // Xử lý kết quả truy vấn MariaDB - đảm bảo là mảng
      let receivedRows = [];
      if (receivedResult && receivedResult[0]) {
        receivedRows = Array.isArray(receivedResult[0]) ? receivedResult[0] : [receivedResult[0]];
      }
      console.log('Received friend requests count:', receivedRows.length);
      
      // Lấy thông tin người gửi cho từng lời mời
      const receivedWithSenders = [];
      for (const request of receivedRows) {
        if (!request) continue;
        
        try {
          // Lấy thông tin người gửi
          console.log('Fetching sender info for ID:', request.sender_id);
          const senderResult = await conn.query(
            'SELECT id, username, fullname, avatar FROM users WHERE id = ?',
            [request.sender_id]
          );
          
          let senderInfo = null;
          if (senderResult && senderResult[0]) {
            if (Array.isArray(senderResult[0]) && senderResult[0].length > 0) {
              senderInfo = senderResult[0][0];
            } else if (senderResult[0].id) {
              senderInfo = senderResult[0];
            }
          }
          
          if (senderInfo) {
            receivedWithSenders.push({
              id: request.id,
              sender_id: request.sender_id,
              created_at: request.created_at,
              status: request.status,
              sender: senderInfo
            });
          } else {
            console.log('Using default sender info for ID:', request.sender_id);
            receivedWithSenders.push({
              id: request.id,
              sender_id: request.sender_id,
              created_at: request.created_at,
              status: request.status,
              sender: { id: request.sender_id, username: 'Unknown', fullname: 'Unknown User', avatar: '' }
            });
          }
        } catch (senderError) {
          console.error('Error getting sender info:', senderError);
          // Tiếp tục vòng lặp với request tiếp theo
        }
      }
      
      console.log('Received with senders:', receivedWithSenders);
      
      // Lấy lời mời đã gửi
      console.log('Executing query for sent requests...');
      const sentResult = await conn.query(`
        SELECT fr.id, fr.receiver_id, fr.created_at, fr.status
        FROM friend_requests fr
        WHERE fr.sender_id = ? AND fr.status = 'pending'
        ORDER BY fr.created_at DESC
      `, [userId]);
      
      // Log kết quả chi tiết
      console.log('Raw sent result:', JSON.stringify(sentResult));
      
      // Xử lý kết quả truy vấn MariaDB - đảm bảo là mảng
      let sentRows = [];
      if (sentResult && sentResult[0]) {
        sentRows = Array.isArray(sentResult[0]) ? sentResult[0] : [sentResult[0]];
      }
      console.log('Sent friend requests count:', sentRows.length);
      
      // Lấy thông tin người nhận cho từng lời mời
      const sentWithReceivers = [];
      for (const request of sentRows) {
        if (!request) continue;
        
        try {
          // Lấy thông tin người nhận
          console.log('Fetching receiver info for ID:', request.receiver_id);
          const receiverResult = await conn.query(
            'SELECT id, username, fullname, avatar FROM users WHERE id = ?',
            [request.receiver_id]
          );
          
          let receiverInfo = null;
          if (receiverResult && receiverResult[0]) {
            if (Array.isArray(receiverResult[0]) && receiverResult[0].length > 0) {
              receiverInfo = receiverResult[0][0];
            } else if (receiverResult[0].id) {
              receiverInfo = receiverResult[0];
            }
          }
          
          if (receiverInfo) {
            sentWithReceivers.push({
              id: request.id,
              receiver_id: request.receiver_id,
              created_at: request.created_at,
              status: request.status,
              receiver: receiverInfo
            });
          } else {
            console.log('Using default receiver info for ID:', request.receiver_id);
            sentWithReceivers.push({
              id: request.id,
              receiver_id: request.receiver_id,
              created_at: request.created_at,
              status: request.status,
              receiver: { id: request.receiver_id, username: 'Unknown', fullname: 'Unknown User', avatar: '' }
            });
          }
        } catch (receiverError) {
          console.error('Error getting receiver info:', receiverError);
          // Tiếp tục vòng lặp với request tiếp theo
        }
      }
      
      console.log('Sent with receivers:', sentWithReceivers);
      
      // Trả về cả hai danh sách lời mời
      return res.json({ 
        success: true, 
        received: receivedWithSenders, 
        sent: sentWithReceivers 
      });
    } catch (innerError) {
      console.error('Inner error in getFriendRequests:', innerError);
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi xử lý dữ liệu lời mời kết bạn', 
        error: innerError.message 
      });
    }
  } catch (error) {
    console.error('Error in getFriendRequests:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi lấy danh sách lời mời kết bạn', 
      error: error.message 
    });
  } finally {
    if (conn) conn.release();
  }
};

// Gửi lời mời kết bạn
exports.sendFriendRequest = async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const { userId } = req.user;
    const { receiverId } = req.body;
    
    console.log('Sending friend request from', userId, 'to', receiverId);
    
    if (!receiverId) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin người nhận' });
    }

    try {
      // Kiểm tra người dùng đích có tồn tại không
      const userCheckResult = await conn.query('SELECT 1 FROM users WHERE id = ?', [receiverId]);
      const users = userCheckResult[0];
      
      console.log('User check result:', users);
      
      if (!users || users.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
      }

      // Kiểm tra đã là bạn bè chưa
      const friendCheckResult = await conn.query(
        'SELECT 1 FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
        [userId, receiverId, receiverId, userId]
      );
      const friendCheck = friendCheckResult[0];
      
      console.log('Friend check result:', friendCheck);
      
      if (friendCheck && friendCheck.length > 0) {
        return res.status(400).json({ success: false, message: 'Đã là bạn bè' });
      }

      // Kiểm tra lời mời kết bạn
      const requestsResult = await conn.query(
        'SELECT id, sender_id, receiver_id, status FROM friend_requests WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)',
        [userId, receiverId, receiverId, userId]
      );
      const requests = requestsResult[0];
      
      console.log('Friend requests result:', requests);

      if (requests && requests.length > 0) {
        for (const request of requests) {
          console.log('Checking request:', request);
          
          // Nếu đã nhận lời mời từ người này, tự động chấp nhận
          if (request.sender_id == receiverId && request.receiver_id == userId && request.status === 'pending') {
            console.log('Found pending request from receiver to sender, auto-accepting');
            await conn.query('UPDATE friend_requests SET status = ? WHERE id = ?', ['accepted', request.id]);
            await conn.query('INSERT INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)', 
              [userId, receiverId, receiverId, userId]);
            return res.json({ success: true, message: 'Đã chấp nhận lời mời kết bạn', autoAccepted: true });
          }
          
          // Nếu đã gửi lời mời rồi và vẫn đang pending
          if (request.sender_id == userId && request.receiver_id == receiverId && request.status === 'pending') {
            console.log('Found pending request from sender to receiver');
            return res.status(409).json({ 
              success: false, 
              message: 'Bạn đã gửi lời mời kết bạn cho người này rồi',
              requestId: request.id  // Trả về ID của lời mời để frontend có thể sử dụng nếu cần
            });
          }
          
          // Nếu đã từng gửi lời mời nhưng bị từ chối, cho phép gửi lại
          if (request.sender_id == userId && request.receiver_id == receiverId && request.status === 'rejected') {
            console.log('Found rejected request, updating status to pending');
            await conn.query('UPDATE friend_requests SET status = ? WHERE id = ?', ['pending', request.id]);
            
            // Lấy thông tin người gửi
            const senderInfoResult = await conn.query(
              'SELECT id, username, fullname, avatar FROM users WHERE id = ?',
              [userId]
            );
            
            console.log('Sender info result:', senderInfoResult);
            
            // Đảm bảo lấy đúng dữ liệu từ kết quả truy vấn
            const senderInfo = senderInfoResult && senderInfoResult[0] && senderInfoResult[0].length > 0 
              ? senderInfoResult[0][0] 
              : { id: userId, username: 'Unknown', fullname: 'Unknown User', avatar: '' };
            
            // Tạo thông báo lời mời kết bạn
            const friendRequest = {
              id: request.id,
              sender_id: userId,
              receiver_id: receiverId,
              sender: senderInfo,
              created_at: new Date().toISOString(),
              status: 'pending'
            };
            
            console.log('Updated friend request object:', friendRequest);
            
            // Gửi thông báo qua socket.io
            try {
              if (req.io) {
                console.log('Emitting friendRequest event to user_' + receiverId);
                req.io.to(`user_${receiverId}`).emit('friendRequest', friendRequest);
              } else if (global.io) {
                console.log('Using global.io to emit friendRequest event to user_' + receiverId);
                global.io.to(`user_${receiverId}`).emit('friendRequest', friendRequest);
              } else {
                console.log('Socket.io not available in request or global');
              }
            } catch (socketError) {
              console.error('Error emitting socket event:', socketError);
            }
            
            return res.json({ success: true, message: 'Đã gửi lại lời mời kết bạn', requestId: request.id });
          }
        }
      }

      // Gửi lời mời kết bạn mới
      console.log('Inserting new friend request');
      const resultInsert = await conn.query(
        'INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES (?, ?, ?)',
        [userId, receiverId, 'pending']
      );
      
      console.log('Insert result:', resultInsert);
      
      // Lấy ID của lời mời kết bạn vừa tạo
      let requestId;
      if (resultInsert && resultInsert[0]) {
        // Trường hợp 1: insertId nằm trực tiếp trong kết quả
        if (resultInsert[0].insertId) {
          // Đối với BigInt, chuyển đổi thành số nguyên
          requestId = typeof resultInsert[0].insertId === 'bigint' 
            ? Number(resultInsert[0].insertId) 
            : resultInsert[0].insertId;
          console.log('Got request ID from insertId (object format):', requestId);
        } 
        // Trường hợp 2: Phiên bản MariaDB khác có thể trả về cấu trúc khác
        else if (resultInsert.insertId) {
          requestId = typeof resultInsert.insertId === 'bigint' 
            ? Number(resultInsert.insertId) 
            : resultInsert.insertId;
          console.log('Got request ID from insertId (direct format):', requestId);
        }
        // Một số trường hợp insertId là dạng BigInt
        else if (resultInsert[0] && typeof resultInsert[0] === 'object' && 'insertId' in resultInsert[0]) {
          requestId = Number(resultInsert[0].insertId);
          console.log('Got request ID from insertId (bigint format):', requestId);
        }
        
        console.log('InsertId processed result:', { type: typeof requestId, value: requestId });
      }
      
      // Nếu không thể lấy insertId, thực hiện truy vấn dự phòng
      if (!requestId) {
        try {
          console.log('Using fallback query to get request ID');
          const checkResult = await conn.query(
            'SELECT id FROM friend_requests WHERE sender_id = ? AND receiver_id = ? AND status = "pending" ORDER BY id DESC LIMIT 1',
            [userId, receiverId]
          );
          
          console.log('Fallback query result:', JSON.stringify(checkResult));
          
          if (checkResult && checkResult[0]) {
            // Kiểm tra các kiểu cấu trúc dữ liệu có thể có
            if (Array.isArray(checkResult[0]) && checkResult[0].length > 0 && checkResult[0][0].id) {
              requestId = checkResult[0][0].id;
            } else if (checkResult[0].id) {
              requestId = checkResult[0].id;
            } else if (checkResult[0][0] && checkResult[0][0].id) {
              requestId = checkResult[0][0].id;
            }
            
            console.log('Got request ID from fallback query:', requestId);
          }
        } catch (error) {
          console.error('Error in fallback query:', error);
        }
      }
      
      // Kiểm tra cuối cùng xem có ID không
      if (!requestId) {
        console.error('Failed to retrieve request ID by any method');
        return res.status(500).json({
          success: false,
          message: 'Không thể tạo lời mời kết bạn',
          error: 'Cannot retrieve request ID'
        });
      }
      
      // Lấy thông tin người gửi
      const senderInfoResult = await conn.query(
        'SELECT id, username, fullname, avatar FROM users WHERE id = ?',
        [userId]
      );
      
      console.log('Sender info result:', senderInfoResult);
      
      // Đảm bảo lấy đúng dữ liệu từ kết quả truy vấn
      const senderInfo = senderInfoResult && senderInfoResult[0] && senderInfoResult[0].length > 0 
        ? senderInfoResult[0][0] 
        : { id: userId, username: 'Unknown', fullname: 'Unknown User', avatar: '' };
      
      // Tạo thông báo lời mời kết bạn
      const friendRequest = {
        id: requestId,
        sender_id: userId,
        receiver_id: receiverId,
        sender: senderInfo,
        created_at: new Date().toISOString(),
        status: 'pending'
      };
      
      console.log('Friend request object:', friendRequest);
      
      // Gửi thông báo qua socket.io
      try {
        if (req.io) {
          console.log('Emitting friendRequest event to user_' + receiverId);
          req.io.to(`user_${receiverId}`).emit('friendRequest', friendRequest);
        } else if (global.io) {
          console.log('Using global.io to emit friendRequest event to user_' + receiverId);
          global.io.to(`user_${receiverId}`).emit('friendRequest', friendRequest);
        } else {
          console.log('Socket.io not available in request or global');
        }
      } catch (socketError) {
        console.error('Error emitting socket event:', socketError);
      }
      
      return res.json({ success: true, message: 'Đã gửi lời mời kết bạn', requestId: requestId });
    } catch (duplicateError) {
      // Xử lý lỗi duplicate entry
      if (duplicateError.code === 'ER_DUP_ENTRY') {
        console.log('Duplicate friend request detected');
        
        // Kiểm tra xem lời mời hiện tại có phải đã bị từ chối không
        try {
          const existingRequest = await conn.query(
            'SELECT id, status FROM friend_requests WHERE sender_id = ? AND receiver_id = ? ORDER BY id DESC LIMIT 1',
            [userId, receiverId]
          );
          
          if (existingRequest && existingRequest[0] && existingRequest[0].length > 0) {
            const request = existingRequest[0][0];
            
            // Nếu lời mời bị từ chối, cập nhật lại thành pending
            if (request.status === 'rejected') {
              console.log('Found rejected request, updating to pending:', request.id);
              await conn.query('UPDATE friend_requests SET status = ? WHERE id = ?', ['pending', request.id]);
              return res.json({ success: true, message: 'Đã gửi lại lời mời kết bạn', requestId: request.id });
            }
          }
        } catch (existingError) {
          console.error('Error checking existing request:', existingError);
        }
        
        return res.status(400).json({ 
          success: false, 
          message: 'Bạn đã gửi lời mời kết bạn cho người này rồi' 
        });
      }
      
      console.error('Error in inner try-catch:', duplicateError);
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi gửi lời mời kết bạn', 
        error: duplicateError.message 
      });
    }
  } catch (error) {
    console.error('Error in sendFriendRequest:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi gửi lời mời kết bạn', 
      error: error.message 
    });
  } finally {
    if (conn) conn.release();
  }
};

// Chấp nhận lời mời kết bạn
exports.acceptFriendRequest = async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const { userId } = req.user;
    const { requestId } = req.params;

    console.log('Accepting friend request:', requestId, 'for user:', userId);

    // Kiểm tra lời mời kết bạn tồn tại và thuộc về người dùng hiện tại
    const [requests] = await conn.query(
      'SELECT sender_id FROM friend_requests WHERE id = ? AND receiver_id = ? AND status = ?',
      [requestId, userId, 'pending']
    );
    
    console.log('Found requests:', JSON.stringify(requests));
    
    // Kiểm tra kết quả truy vấn một cách kỹ lưỡng hơn
    if (!requests || requests.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lời mời kết bạn' });
    }
    
    // Kiểm tra cấu trúc dữ liệu
    let senderId;
    if (Array.isArray(requests) && requests.length > 0 && requests[0]?.sender_id) {
      senderId = requests[0].sender_id;
    } else {
      console.error('Cấu trúc dữ liệu không hợp lệ:', JSON.stringify(requests));
      return res.status(400).json({ 
        success: false, 
        message: 'Dữ liệu lời mời kết bạn không hợp lệ',
        debug: JSON.stringify(requests)
      });
    }
    
    console.log('Accepting request from sender:', senderId);
    
    // Cập nhật trạng thái lời mời kết bạn
    await conn.query('UPDATE friend_requests SET status = ? WHERE id = ?', ['accepted', requestId]);
    
    // Thêm vào bảng bạn bè (cả hai chiều)
    await conn.query('INSERT INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)', 
      [userId, senderId, senderId, userId]);

    console.log('Friend request accepted successfully');
    res.json({ success: true, message: 'Đã chấp nhận lời mời kết bạn' });
  } catch (error) {
    console.error('Error in acceptFriendRequest:', error);
    handleError(res, error, 'Lỗi chấp nhận lời mời kết bạn:');
  } finally {
    if (conn) conn.release();
  }
};

// Từ chối lời mời kết bạn
exports.rejectFriendRequest = async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const { userId } = req.user;
    const { requestId } = req.params;

    const [requests] = await conn.query(
      'SELECT 1 FROM friend_requests WHERE id = ? AND receiver_id = ? AND status = ?',
      [requestId, userId, 'pending']
    );
    
    if (requests.length === 0) return res.status(404).json({ message: 'Không tìm thấy lời mời kết bạn' });

    await conn.query('UPDATE friend_requests SET status = ? WHERE id = ?', ['rejected', requestId]);
    res.json({ success: true, message: 'Đã từ chối lời mời kết bạn' });
  } catch (error) {
    handleError(res, error, 'Lỗi từ chối lời mời kết bạn:');
  } finally {
    if (conn) conn.release();
  }
};

// Hủy lời mời kết bạn đã gửi
exports.cancelFriendRequest = async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const { userId } = req.user;
    const { requestId } = req.params;

    console.log('Canceling friend request:', requestId, 'from user:', userId);

    // Kiểm tra lời mời kết bạn tồn tại và do người dùng hiện tại gửi
    const [requests] = await conn.query(
      'SELECT receiver_id FROM friend_requests WHERE id = ? AND sender_id = ? AND status = ?',
      [requestId, userId, 'pending']
    );
    
    console.log('Found requests to cancel:', requests);
    
    if (!requests || requests.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lời mời kết bạn' });
    }

    // Cập nhật trạng thái lời mời kết bạn thành đã từ chối (sử dụng 'rejected' thay vì 'canceled')
    // vì có vẻ như cơ sở dữ liệu chỉ chấp nhận các giá trị ENUM 'pending', 'accepted', 'rejected'
    await conn.query('UPDATE friend_requests SET status = ? WHERE id = ?', ['rejected', requestId]);
    
    console.log('Friend request canceled successfully');
    res.json({ success: true, message: 'Đã hủy lời mời kết bạn' });
  } catch (error) {
    console.error('Error in cancelFriendRequest:', error);
    handleError(res, error, 'Lỗi hủy lời mời kết bạn:');
  } finally {
    if (conn) conn.release();
  }
};

// Xóa bạn bè
exports.removeFriend = async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const { userId } = req.user;
    const { friendId } = req.params;

    const [friendCheck] = await conn.query(
      'SELECT 1 FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
      [userId, friendId, friendId, userId]
    );
    
    if (friendCheck.length === 0) return res.status(404).json({ message: 'Không tìm thấy bạn bè' });

    await conn.query(
      'DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
      [userId, friendId, friendId, userId]
    );
    
    res.json({ success: true, message: 'Đã xóa bạn bè' });
  } catch (error) {
    handleError(res, error, 'Lỗi xóa bạn bè:');
  } finally {
    if (conn) conn.release();
  }
};

// Tìm kiếm người dùng
exports.searchUsers = async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const { userId } = req.user;
    const { q } = req.query;
    
    console.log('Searching users with keyword:', q, 'for user:', userId);
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Từ khóa tìm kiếm phải có ít nhất 2 ký tự' });
    }

    // Tìm kiếm người dùng và kiểm tra mối quan hệ
    const [users] = await conn.query(`
      SELECT u.id, u.username, u.fullname, u.avatar,
        CASE
          WHEN f.user_id IS NOT NULL THEN 'friend'
          WHEN fr_sent.id IS NOT NULL THEN 'sent_request'
          WHEN fr_received.id IS NOT NULL THEN 'received_request'
          ELSE 'none'
        END as relationship
      FROM users u
      LEFT JOIN friends f ON (f.user_id = ? AND f.friend_id = u.id) OR (f.user_id = u.id AND f.friend_id = ?)
      LEFT JOIN friend_requests fr_sent ON fr_sent.sender_id = ? AND fr_sent.receiver_id = u.id AND fr_sent.status = 'pending'
      LEFT JOIN friend_requests fr_received ON fr_received.sender_id = u.id AND fr_received.receiver_id = ? AND fr_received.status = 'pending'
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
    
    console.log(`Found ${users.length} users matching keyword "${q}"`);
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error in searchUsers:', error);
    handleError(res, error, 'Lỗi tìm kiếm người dùng:');
  } finally {
    if (conn) conn.release();
  }
};