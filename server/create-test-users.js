import bcrypt from 'bcryptjs';
import { db } from './db/index.js';

const createTestUsers = async () => {
  try {
    console.log('🔧 Создание тестовых пользователей...\n');

    // Пароль для всех тестовых пользователей
    const password = 'password123';
    const passwordHash = await bcrypt.hash(password, 10);

    const testUsers = [
      {
        email: 'admin@motoshop.ru',
        firstName: 'Админ',
        lastName: 'Админов',
        phone: '+79991234567',
        role: 'admin'
      },
      {
        email: 'manager@motoshop.ru',
        firstName: 'Менеджер',
        lastName: 'Менеджеров',
        phone: '+79991234568',
        role: 'manager'
      },
      {
        email: 'user@motoshop.ru',
        firstName: 'Пользователь',
        lastName: 'Пользователев',
        phone: '+79991234569',
        role: 'customer'
      }
    ];

    for (const userData of testUsers) {
      console.log(`📧 Создание пользователя: ${userData.email}`);

      // Проверяем, существует ли пользователь
      const existingUser = await db('users').where({ email: userData.email }).first();
      
      if (existingUser) {
        console.log(`   ⚠️  Пользователь уже существует, обновляем пароль...`);
        
        // Обновляем пароль
        await db('users')
          .where({ email: userData.email })
          .update({ password_hash: passwordHash });
        
        console.log(`   ✅ Пароль обновлен`);
      } else {
        // Создаем нового пользователя
        const [newUser] = await db('users').insert({
          email: userData.email,
          password_hash: passwordHash,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone,
          is_active: true
        }).returning('id');

        const userId = newUser.id || newUser;
        console.log(`   ✅ Пользователь создан (ID: ${userId})`);

        // Получаем роль
        const role = await db('roles').where({ name: userData.role }).first();
        if (!role) {
          console.log(`   ❌ Роль "${userData.role}" не найдена!`);
          continue;
        }

        // Назначаем роль
        await db('user_roles').insert({
          user_id: userId,
          role_id: role.id
        });
        console.log(`   ✅ Роль "${userData.role}" назначена`);

        // Создаем настройки
        await db('user_settings').insert({
          user_id: userId,
          theme: 'light',
          date_format: 'DD.MM.YYYY',
          items_per_page: 10,
          preferred_language: 'ru',
          notification_enabled: true
        });
        console.log(`   ✅ Настройки созданы`);
      }
      console.log('');
    }

    console.log('✅ Все тестовые пользователи созданы!\n');
    console.log('📋 Данные для входа:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: admin@motoshop.ru');
    console.log('Пароль: password123');
    console.log('Роль: Администратор');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: manager@motoshop.ru');
    console.log('Пароль: password123');
    console.log('Роль: Менеджер');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: user@motoshop.ru');
    console.log('Пароль: password123');
    console.log('Роль: Покупатель');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при создании тестовых пользователей:', error);
    process.exit(1);
  }
};

createTestUsers();
