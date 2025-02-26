// ... existing code ...
const mariadb = require('mariadb');

// Tạo pool với cấu hình được tối ưu hơn để tránh timeout
const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5, // Giảm giới hạn kết nối xuống để quản lý hiệu quả hơn
    port: process.env.DB_PORT || 3306,
    connectTimeout: 10000, // Giảm thời gian timeout xuống 10 giây
    acquireTimeout: 10000, // Giảm thời gian chờ lấy kết nối
    idleTimeout: 60000,
    allowPublicKeyRetrieval: true,
    ssl: false,
    multipleStatements: true,
    trace: true,
    resetAfterUse: false, // Không reset kết nối sau khi sử dụng để tái sử dụng
    bigNumberStrings: true,
    supportBigNumbers: true,
    dateStrings: true,
    connectRetryCount: 3, // Số lần thử kết nối lại
    initializationTimeout: 10000 // Thời gian tối đa để khởi tạo kết nối
});

// Hàm kiểm tra kết nối MariaDB
const checkMariaDBServer = async () => {
    try {
        // Thử kết nối trực tiếp không qua pool
        const conn = await mariadb.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT || 3306,
            connectTimeout: 5000
        });
        await conn.end();
        return true;
    } catch (error) {
        console.error("Không thể kết nối trực tiếp đến MariaDB:", error.message);
        return false;
    }
};

// Cải tiến hàm getConnection để thử kết nối trực tiếp trước khi dùng pool
const getConnection = async () => {
    let attempts = 0;
    const maxAttempts = 3;
    const retryInterval = 1000; // 1 giây
    
    // Kiểm tra nếu MariaDB server đang chạy
    const isServerRunning = await checkMariaDBServer();
    if (!isServerRunning) {
        throw new Error("Không thể kết nối đến MariaDB server. Vui lòng kiểm tra MariaDB đã được khởi động chưa.");
    }
    
    while (attempts < maxAttempts) {
        try {
            console.log(`Đang thử kết nối lần ${attempts + 1}/${maxAttempts}...`);
            const connection = await pool.getConnection();
            console.log('Kết nối database thành công');
            
            // Bao bọc xử lý lỗi khi truy vấn kiểm tra
            try {
                await connection.query('SELECT 1 as connection_test');
            } catch (queryError) {
                console.error('Lỗi khi thực hiện truy vấn kiểm tra:', queryError);
                connection.release();
                throw queryError;
            }
            
            return connection;
        } catch (err) {
            attempts++;
            console.error(`Lỗi kết nối database (lần thử ${attempts}/${maxAttempts}):`, err.message);
            
            if (attempts >= maxAttempts) {
                console.error('Đã thử kết nối lại tối đa số lần. Không thể kết nối database.');
                throw new Error('Không thể kết nối đến database sau nhiều lần thử. Vui lòng kiểm tra cấu hình kết nối và đảm bảo server database đang chạy.');
            }
            
            // Chờ một khoảng thời gian trước khi thử lại
            await new Promise(resolve => setTimeout(resolve, retryInterval));
        }
    }
};

// Cải tiến hàm testConnection để cung cấp thông tin chẩn đoán chi tiết hơn
const testConnection = async () => {
    try {
        // Kiểm tra MariaDB server trước
        const isServerRunning = await checkMariaDBServer();
        if (!isServerRunning) {
            return {
                success: false,
                message: 'Không thể kết nối đến MariaDB server. Vui lòng kiểm tra MariaDB đã được khởi động chưa.',
                error: 'SERVER_UNREACHABLE'
            };
        }
        
        const connection = await pool.getConnection();
        console.log('🟢 Kết nối database thành công');
        
        const result = await connection.query('SELECT 1 as connection_test');
        console.log('🟢 Truy vấn test thành công:', result);
        
        connection.release();
        return { success: true, message: 'Kết nối database hoạt động tốt' };
    } catch (error) {
        console.error('🔴 Lỗi kết nối database:', error);
        let errorMessage = 'Không thể kết nối đến database';
        let errorCode = 'UNKNOWN_ERROR';
        
        if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Không thể kết nối đến MariaDB server. Vui lòng kiểm tra server MariaDB đã chạy chưa và cổng đã mở chưa.';
            errorCode = 'CONNECTION_REFUSED';
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            errorMessage = 'Sai tên đăng nhập hoặc mật khẩu khi kết nối đến MariaDB.';
            errorCode = 'ACCESS_DENIED';
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            errorMessage = 'Database không tồn tại. Vui lòng kiểm tra tên database.';
            errorCode = 'DATABASE_NOT_FOUND';
        } else if (error.message && error.message.includes('timeout')) {
            errorMessage = 'Kết nối bị timeout. Vui lòng kiểm tra MariaDB có đang chạy và mạng có ổn định không.';
            errorCode = 'CONNECTION_TIMEOUT';
        }
        
        return { 
            success: false, 
            message: errorMessage, 
            error: error.message,
            code: errorCode 
        };
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
// ... existing code ...