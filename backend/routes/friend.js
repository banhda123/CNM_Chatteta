const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const friendController = require('../controllers/friendController');
const { body, param, query, validationResult } = require('express-validator');

// Validation rules
const friendRequestValidation = [
    body('receiverId')
        .isInt()
        .withMessage('ID người dùng không hợp lệ')
        .custom(async (value, { req }) => {
            if (value == req.user.userId) {
                throw new Error('Không thể gửi lời mời kết bạn cho chính mình');
            }
            return true;
        })
];

// Lấy danh sách bạn bè
router.get('/', 
    auth,
    query('page').optional().isInt({ min: 1 }).withMessage('Số trang không hợp lệ'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Số lượng bạn bè không hợp lệ'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        friendController.getFriends(req, res);
});

router.get('/list', 
    auth,
    query('page').optional().isInt({ min: 1 }).withMessage('Số trang không hợp lệ'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Số lượng bạn bè không hợp lệ'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        friendController.getFriends(req, res);
});

// Lấy danh sách lời mời kết bạn
router.get('/requests', 
    auth,
    query('page').optional().isInt({ min: 1 }).withMessage('Số trang không hợp lệ'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Số lượng lời mời không hợp lệ'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        friendController.getFriendRequests(req, res);
});

// Gửi lời mời kết bạn
router.post('/request', 
    auth,
    friendRequestValidation,
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        // Thêm io vào req object nếu chưa có và global.io tồn tại
        if (!req.io && global.io) {
            req.io = global.io;
        }
        
        friendController.sendFriendRequest(req, res);
});

// Chấp nhận lời mời kết bạn
router.put('/request/:requestId/accept', 
    auth,
    param('requestId').isInt().withMessage('ID lời mời không hợp lệ'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        friendController.acceptFriendRequest(req, res);
});

// Từ chối lời mời kết bạn
router.put('/request/:requestId/reject', 
    auth,
    param('requestId').isInt().withMessage('ID lời mời không hợp lệ'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        friendController.rejectFriendRequest(req, res);
});

// Hủy lời mời kết bạn đã gửi
router.delete('/request/:requestId', 
    auth,
    param('requestId').isInt().withMessage('ID lời mời không hợp lệ'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        friendController.cancelFriendRequest(req, res);
});

// Xóa bạn bè
router.delete('/:friendId', 
    auth,
    param('friendId').isInt().withMessage('ID bạn bè không hợp lệ'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        friendController.removeFriend(req, res);
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
        friendController.searchUsers(req, res);
});

module.exports = router;
