import bcrypt from 'bcryptjs';
import { db } from './db/index.js';

const updatePasswords = async () => {
  try {
    console.log('🔐 Обновление паролей пользователей...\n');
    
    // Генерируем хэш для пароля "admin123"
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    
    console.log(`🔑 Новый хэш для пароля "${password}":`);
    console.log(`   ${hash}\n`);
    
    // Обновляем пароли для всех тестовых пользователей
    const result = await db('users')
      .whereIn('email', ['admin@motoshop.ru', 'manager@motoshop.ru', 'user@example.com'])
      .update({
        password_hash: hash,
        updated_at: db.fn.now()
      });
    
    console.log(`✅ Обновлено паролей: ${result}\n`);
    
    // Проверяем обновление
    const users = await db('users')
      .whereIn('email', ['admin@motoshop.ru', 'manager@motoshop.ru', 'user@example.com'])
      .select('email', 'first_name', 'last_name');
    
    console.log('👥 Обновленные пользователи:');
    for (const user of users) {
      console.log(`   - ${user.email} (${user.first_name} ${user.last_name})`);
      
      // Получаем роли
      const roles = await db('user_roles')
        .join('roles', 'user_roles.role_id', 'roles.id')
        .where('user_roles.user_id', (await db('users').where({ email: user.email }).first()).id)
        .select('roles.name');
      
      console.log(`     Роли: ${roles.map(r => r.name).join(', ')}`);
    }
    
    console.log('\n✅ Пароли успешно обновлены!');
    console.log('\n🔑 Учетные данные для входа:');
    console.log('   Администратор: admin@motoshop.ru / admin123');
    console.log('   Менеджер: manager@motoshop.ru / admin123');
    console.log('   Покупатель: user@example.com / admin123');
    console.log('\n⚠️  Все пользователи используют один пароль: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при обновлении паролей:', error);
    process.exit(1);
  }
};

updatePasswords();
