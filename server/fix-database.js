import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { db } from './db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fixDatabase = async () => {
  try {
    console.log('🔧 Начинаем исправление базы данных...\n');
    
    // Читаем SQL файл
    const sqlPath = path.join(__dirname, '..', 'fix_database.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Разбиваем на отдельные запросы
    const queries = sql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'));
    
    console.log(`📝 Найдено ${queries.length} SQL запросов\n`);
    
    // Выполняем каждый запрос
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      if (query.length > 0) {
        try {
          console.log(`⏳ Выполняется запрос ${i + 1}/${queries.length}...`);
          await db.raw(query);
          console.log(`✅ Запрос ${i + 1} выполнен успешно`);
        } catch (error) {
          // Игнорируем ошибки конфликтов (ON CONFLICT)
          if (!error.message.includes('duplicate') && !error.message.includes('уже существует')) {
            console.error(`❌ Ошибка в запросе ${i + 1}:`, error.message);
          }
        }
      }
    }
    
    console.log('\n📊 Проверка данных в базе...\n');
    
    // Проверяем пользователей
    const users = await db('users').select('email', 'first_name', 'last_name');
    console.log('👥 Пользователи:', users.length);
    users.forEach(u => console.log(`   - ${u.email} (${u.first_name} ${u.last_name})`));
    
    // Проверяем роли
    const roles = await db('roles').select('name');
    console.log('\n🔐 Роли:', roles.length);
    roles.forEach(r => console.log(`   - ${r.name}`));
    
    // Проверяем категории
    const categories = await db('categories').where({ parent_id: null }).select('name', 'slug');
    console.log('\n📁 Основные категории:', categories.length);
    categories.forEach(c => console.log(`   - ${c.name} (${c.slug})`));
    
    // Проверяем товары
    const products = await db('products').select('name', 'price');
    console.log('\n🛒 Товары:', products.length);
    products.forEach(p => console.log(`   - ${p.name} - ${p.price} руб.`));
    
    // Проверяем инвентарь
    const inventory = await db('inventory').select('*');
    console.log('\n📦 Складские остатки:', inventory.length);
    
    console.log('\n✅ База данных успешно исправлена!');
    console.log('\n🔑 Учетные данные для входа:');
    console.log('   Администратор: admin@motoshop.ru / admin123');
    console.log('   Менеджер: manager@motoshop.ru / manager123');
    console.log('   Покупатель: user@example.com / user123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при исправлении базы данных:', error);
    process.exit(1);
  }
};

fixDatabase();
