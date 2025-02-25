import mariadb from 'mariadb';

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5
});

export const getConnection = async () => {
    try {
        return await pool.getConnection();
    } catch (err) {
        console.error('Lỗi kết nối database:', err);
        throw err;
    }
};