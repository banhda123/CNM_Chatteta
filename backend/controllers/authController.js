const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const User = require('../models/User');

// Đăng ký tài khoản mới
exports.register = async (req, res) => {
    try {
        const { username, password, fullname } = req.body;
        
        // Kiểm tra dữ liệu đầu vào
        if (!username || !password || !fullname) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
        }
        
        // Kiểm tra độ dài mật khẩu
        if (password.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
        }
        
        let conn;
        try {
            conn = await db.getConnection();
        } catch (dbError) {
            console.error('Lỗi kết nối database khi đăng ký:', dbError);
            return res.status(500).json({ 
                message: 'Không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau.',
                error: dbError.message
            });
        }
        
        try {
            // Kiểm tra username tồn tại
            const [users] = await conn.query(
                'SELECT id FROM users WHERE username = ?',
                [username]
            );
            
            if (users.length > 0) {
                return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
            }

            // Mã hóa mật khẩu
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Thêm user mới
            const [result] = await conn.query(
                'INSERT INTO users (username, password, fullname, status) VALUES (?, ?, ?, ?)',
                [username, hashedPassword, fullname, 'offline']
            );
            
            const userId = result.insertId;
            
            // Kiểm tra xem cuộc trò chuyện chung đã tồn tại chưa
            const [chatExists] = await conn.query(
                'SELECT id FROM conversations WHERE id = 1'
            );
            
            if (chatExists.length === 0) {
                // Tạo cuộc trò chuyện chung nếu chưa tồn tại
                await conn.query(
                    'INSERT INTO conversations (id, name, type) VALUES (1, "Chat chung", "group")'
                );
            }
            
            // Thêm người dùng vào cuộc trò chuyện chung
            await conn.query(
                'INSERT INTO conversation_members (conversation_id, user_id) VALUES (1, ?)',
                [userId]
            );
            
            res.status(201).json({ 
                success: true,
                message: 'Đăng ký thành công',
                userId: userId
            });
        } catch (queryError) {
            console.error('Lỗi truy vấn database khi đăng ký:', queryError);
            return res.status(500).json({ 
                message: 'Lỗi khi xử lý đăng ký. Vui lòng thử lại sau.',
                error: queryError.message
            });
        } finally {
            if (conn) conn.release();
        }
    } catch (error) {
        console.error('Lỗi đăng ký:', error);
        res.status(500).json({ 
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Đăng nhập
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Kiểm tra dữ liệu đầu vào
        if (!username || !password) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
        }
        
        const conn = await db.getConnection();
        
        try {
            const [users] = await conn.query(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );
            
            if (users.length === 0) {
                return res.status(401).json({ message: 'Thông tin đăng nhập không chính xác' });
            }

            const user = users[0];
            const validPassword = await bcrypt.compare(password, user.password);

            if (!validPassword) {
                return res.status(401).json({ message: 'Thông tin đăng nhập không chính xác' });
            }

            // Cập nhật trạng thái online
            await User.updateStatus(user.id, 'online');

            // Tạo JWT token
            const token = jwt.sign(
                { userId: user.id, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    fullname: user.fullname,
                    avatar: user.avatar,
                    status: 'online'
                }
            });
        } catch (error) {
            console.error('Lỗi truy vấn database khi đăng nhập:', error);
            res.status(500).json({ message: 'Lỗi server', error: error.message });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Đăng xuất
exports.logout = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Cập nhật trạng thái offline
        await User.updateStatus(userId, 'offline');
        
        res.json({ success: true, message: 'Đăng xuất thành công' });
    } catch (error) {
        console.error('Lỗi đăng xuất:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Kiểm tra token
exports.checkAuth = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        
        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Lỗi kiểm tra token:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};