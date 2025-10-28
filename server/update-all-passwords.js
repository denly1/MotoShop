import bcrypt from 'bcryptjs';
import { db } from './db/index.js';

const updateAllPasswords = async () => {
  try {
    console.log('🔐 Обновление паролей для всех пользователей...\n');
    
    // Создаем хэши для разных паролей
    const adminHash = await bcrypt.hash('admin123', 10);
    const managerHash = await bcrypt.hash('manager123', 10);
    const userHash = await bcrypt.hash('user123', 10);
    
    console.log('🔑 Созданные хэши:');
    console.log(`   admin123: ${adminHash}`);
    console.log(`   manager123: ${managerHash}`);
    console.log(`   user123: ${userHash}\n`);
    
    // Обновляем пароль администратора
    await db('users')
      .where({ email: 'admin@motoshop.ru' })
      .update({
        password_hash: adminHash,
        updated_at: db.fn.now()
      });
    console.log('✅ Пароль администратора обновлен (admin123)');
    
    // Обновляем пароль менеджера
    await db('users')
      .where({ email: 'manager@motoshop.ru' })
      .update({
        password_hash: managerHash,
        updated_at: db.fn.now()
      });
    console.log('✅ Пароль менеджера обновлен (manager123)');
    
    // Обновляем пароль пользователя
    await db('users')
      .where({ email: 'user@example.com' })
      .update({
        password_hash: userHash,
        updated_at: db.fn.now()
      });
    console.log('✅ Пароль пользователя обновлен (user123)');
    
    console.log('\n📋 Проверка обновления...\n');
    
    // Проверяем каждого пользователя
    const users = [
      { email: 'admin@motoshop.ru', password: 'admin123', hash: adminHash },
      { email: 'manager@motoshop.ru', password: 'manager123', hash: managerHash },
      { email: 'user@example.com', password: 'user123', hash: userHash }
    ];
    
    for (const testUser of users) {
      const user = await db('users').where({ email: testUser.email }).first();
      
      if (user) {
        const match = await bcrypt.compare(testUser.password, user.password_hash);
        
        // Получаем роли
        const roles = await db('user_roles')
          .join('roles', 'user_roles.role_id', 'roles.id')
          .where('user_roles.user_id', user.id)
          .select('roles.name');
        
        console.log(`👤 ${user.email}`);
        console.log(`   Имя: ${user.first_name} ${user.last_name}`);
        console.log(`   Роли: ${roles.map(r => r.name).join(', ')}`);
        console.log(`   Пароль: ${testUser.password}`);
        console.log(`   Проверка пароля: ${match ? '✅ Совпадает' : '❌ НЕ совпадает'}\n`);
      }
    }
    
    console.log('✅ Все пароли успешно обновлены!\n');
    console.log('🔑 Учетные данные для входа:');
    console.log('┌─────────────────┬──────────────────────────┬──────────────┐');
    console.log('│ Роль            │ Email                    │ Пароль       │');
    console.log('├─────────────────┼──────────────────────────┼──────────────┤');
    console.log('│ Администратор   │ admin@motoshop.ru        │ admin123     │');
    console.log('│ Менеджер        │ manager@motoshop.ru      │ manager123   │');
    console.log('│ Покупатель      │ user@example.com         │ user123      │');
    console.log('└─────────────────┴──────────────────────────┴──────────────┘');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при обновлении паролей:', error);
    process.exit(1);
  }
};

updateAllPasswords();
