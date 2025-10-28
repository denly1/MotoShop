import knex from 'knex';
import dotenv from 'dotenv';

dotenv.config();

// Конфигурация подключения к базе данных
const config = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'motoshop'
  },
  pool: {
    min: 2,
    max: 10
  }
};

// Создание экземпляра knex
const db = knex(config);

// Функция для установки ID пользователя для аудита
const setUserForAudit = async (userId, client = db) => {
  try {
    await client.raw('SET LOCAL app.current_user_id = ?', [userId || null]);
    return true;
  } catch (error) {
    console.error('Error setting user for audit:', error);
    return false;
  }
};

// Проверка подключения к базе данных
const testConnection = async () => {
  try {
    await db.raw('SELECT 1');
    console.log('✅ Подключение к базе данных установлено');
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:', error);
    return false;
  }
};

export { db, testConnection, setUserForAudit };
export default db;
