import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Конфигурация базы данных
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'motoshop'
};

// Директория для хранения резервных копий
const backupDir = path.join(__dirname, '../backups');

// Создание директории для резервных копий, если она не существует
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Функция для создания резервной копии
const createBackup = () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilePath = path.join(backupDir, `backup-${timestamp}.sql`);
  
  // Настройка переменных окружения для pg_dump
  const env = { ...process.env };
  if (dbConfig.password) {
    env.PGPASSWORD = dbConfig.password;
  }
  
  // Команда pg_dump
  const pg_dump = spawn('pg_dump', [
    '-h', dbConfig.host,
    '-p', dbConfig.port,
    '-U', dbConfig.user,
    '-F', 'c', // формат custom
    '-b', // включая большие объекты
    '-v', // verbose
    '-f', backupFilePath,
    dbConfig.database
  ], { env });
  
  pg_dump.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });
  
  pg_dump.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });
  
  pg_dump.on('close', (code) => {
    if (code === 0) {
      console.log(`✅ Резервная копия успешно создана: ${backupFilePath}`);
    } else {
      console.error(`❌ Ошибка при создании резервной копии, код: ${code}`);
    }
  });
};

// Функция для восстановления из резервной копии
const restoreBackup = (backupFilePath) => {
  if (!fs.existsSync(backupFilePath)) {
    console.error(`❌ Файл резервной копии не найден: ${backupFilePath}`);
    return;
  }
  
  // Настройка переменных окружения для pg_restore
  const env = { ...process.env };
  if (dbConfig.password) {
    env.PGPASSWORD = dbConfig.password;
  }
  
  // Команда pg_restore
  const pg_restore = spawn('pg_restore', [
    '-h', dbConfig.host,
    '-p', dbConfig.port,
    '-U', dbConfig.user,
    '-d', dbConfig.database,
    '-v', // verbose
    '--clean', // очистить базу данных перед восстановлением
    '--if-exists', // использовать IF EXISTS при удалении объектов
    backupFilePath
  ], { env });
  
  pg_restore.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });
  
  pg_restore.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });
  
  pg_restore.on('close', (code) => {
    if (code === 0) {
      console.log(`✅ База данных успешно восстановлена из: ${backupFilePath}`);
    } else {
      console.error(`❌ Ошибка при восстановлении базы данных, код: ${code}`);
    }
  });
};

// Обработка аргументов командной строки
const [,, action, backupFile] = process.argv;

if (action === 'backup') {
  createBackup();
} else if (action === 'restore' && backupFile) {
  const backupFilePath = path.resolve(backupFile);
  restoreBackup(backupFilePath);
} else {
  console.log(`
Использование:
  node backup.js backup                  - Создать резервную копию базы данных
  node backup.js restore <путь_к_файлу>  - Восстановить базу данных из файла
  `);
}
