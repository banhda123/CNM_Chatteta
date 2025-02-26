const mariadb = require('mariadb');
const dotenv = require('dotenv');

dotenv.config();

// Tạo pool kết nối đơn giản hơn
const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    connectionLimit: 5,
    connectTimeout: 30000,
    acquireTimeout: 30000,
    allowPublicKeyRetrieval: true
});

// Hàm lấy kết nối từ pool
const getConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Kết nối database thành công');
        return connection;
    } catch (error) {
        console.error('Lỗi kết nối database:', error.message);
        throw error;
    }
};

// Hàm kiểm tra kết nối
const testConnection = async () => {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('🟢 Kết nối database thành công');
        
        // Thực hiện truy vấn đơn giản để kiểm tra
        await connection.query('SELECT 1 as test');
        
        return { 
            success: true, 
            message: 'Kết nối database hoạt động tốt' 
        };
    } catch (error) {
        console.error('🔴 Lỗi kết nối database:', error);
        
        let errorMessage = 'Không thể kết nối đến database';
        
        if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Không thể kết nối đến MariaDB server. Vui lòng kiểm tra server MariaDB đã chạy chưa.';
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            errorMessage = 'Sai tên đăng nhập hoặc mật khẩu khi kết nối đến MariaDB.';
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            errorMessage = 'Database không tồn tại. Vui lòng kiểm tra tên database.';
        }
        
        return { 
            success: false, 
            message: errorMessage, 
            error: error.message 
        };
    } finally {
        if (connection) connection.release();
    }
};

// Đóng pool kết nối
const closePool = async () => {
    try {
        await pool.end();
        console.log('Đã đóng pool kết nối database');
        return true;
    } catch (error) {
        console.error('Lỗi khi đóng pool kết nối:', error);
        return false;
    }
};

module.exports = { getConnection, testConnection, closePool };