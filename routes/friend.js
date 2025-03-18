const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const friendController = require('../controllers/friendController');

// Lấy danh sách bạn bè
router.get('/list', auth, friendController.getFriends);

// Lấy danh sách lời mời kết bạn
router.get('/requests', auth, friendController.getFriendRequests);

// Gửi lời mời kết bạn
router.post('/request', auth, friendController.sendFriendRequest);

// Chấp nhận lời mời kết bạn
router.put('/request/:requestId/accept', auth, friendController.acceptFriendRequest);

// Từ chối lời mời kết bạn
router.put('/request/:requestId/reject', auth, friendController.rejectFriendRequest);

// Xóa bạn bè
router.delete('/:friendId', auth, friendController.removeFriend);

// Tìm kiếm người dùng
router.get('/search', auth, friendController.searchUsers);

module.exports = router;
