const db = require('./config/db');

async function testDB() {
    try {
        const result = await db.testConnection();
        console.log('Kết quả kiểm tra kết nối:', result);
        
        if (result.success) {
            console.log('✅ Kết nối database thành công!');
        } else {
            console.error('❌ Lỗi kết nối database:', result.message);
        }
    } catch (error) {
        console.error('❌ Lỗi không xác định:', error);
    } finally {
        await db.closePool();
    }
}

testDB();