import db from './index.js';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  try {
    console.log('Начало заполнения базы данных...');

    // Проверка существования таблицы roles
    const rolesTableExists = await db.schema.hasTable('roles');
    if (!rolesTableExists) {
      console.log('Таблица roles не существует. Создаем...');
      await db.schema.createTable('roles', table => {
        table.increments('id').primary();
        table.string('name', 50).notNullable().unique();
        table.text('description');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
    }

    // Проверка существования таблицы users
    const usersTableExists = await db.schema.hasTable('users');
    if (!usersTableExists) {
      console.log('Таблица users не существует. Создаем...');
      await db.schema.createTable('users', table => {
        table.increments('id').primary();
        table.string('email', 255).notNullable().unique();
        table.string('password_hash', 255).notNullable();
        table.string('first_name', 100).notNullable();
        table.string('last_name', 100).notNullable();
        table.string('phone', 20);
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
    }

    // Проверка существования таблицы user_roles
    const userRolesTableExists = await db.schema.hasTable('user_roles');
    if (!userRolesTableExists) {
      console.log('Таблица user_roles не существует. Создаем...');
      await db.schema.createTable('user_roles', table => {
        table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.integer('role_id').references('id').inTable('roles').onDelete('CASCADE');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.primary(['user_id', 'role_id']);
      });
    }

    // Проверка существования таблицы user_settings
    const userSettingsTableExists = await db.schema.hasTable('user_settings');
    if (!userSettingsTableExists) {
      console.log('Таблица user_settings не существует. Создаем...');
      await db.schema.createTable('user_settings', table => {
        table.integer('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
        table.string('theme', 50).defaultTo('light');
        table.string('date_format', 20).defaultTo('DD.MM.YYYY');
        table.integer('items_per_page').defaultTo(10);
        table.string('preferred_language', 10).defaultTo('ru');
        table.boolean('notification_enabled').defaultTo(true);
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
    }

    // Заполнение таблицы ролей
    const existingRoles = await db('roles').select('name');
    const existingRoleNames = existingRoles.map(role => role.name);
    
    const rolesToInsert = [
      { name: 'admin', description: 'Администратор системы с полным доступом ко всем функциям' },
      { name: 'manager', description: 'Менеджер с доступом к управлению товарами и заказами' },
      { name: 'customer', description: 'Зарегистрированный покупатель' },
      { name: 'guest', description: 'Гость с ограниченным доступом' }
    ].filter(role => !existingRoleNames.includes(role.name));

    if (rolesToInsert.length > 0) {
      await db('roles').insert(rolesToInsert);
      console.log(`Добавлено ${rolesToInsert.length} ролей`);
    } else {
      console.log('Все роли уже существуют');
    }

    // Хеширование пароля
    const password = 'admin123';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Заполнение таблицы пользователей
    const existingUsers = await db('users').select('email');
    const existingEmails = existingUsers.map(user => user.email);
    
    const usersToInsert = [
      { 
        email: 'admin@motoshop.ru', 
        password_hash: passwordHash, 
        first_name: 'Админ', 
        last_name: 'Системы', 
        phone: '+7 (999) 123-45-67', 
        is_active: true 
      },
      { 
        email: 'manager@motoshop.ru', 
        password_hash: passwordHash, 
        first_name: 'Менеджер', 
        last_name: 'Магазина', 
        phone: '+7 (999) 765-43-21', 
        is_active: true 
      },
      { 
        email: 'user@example.com', 
        password_hash: passwordHash, 
        first_name: 'Иван', 
        last_name: 'Петров', 
        phone: '+7 (999) 555-55-55', 
        is_active: true 
      }
    ].filter(user => !existingEmails.includes(user.email));

    if (usersToInsert.length > 0) {
      await db('users').insert(usersToInsert);
      console.log(`Добавлено ${usersToInsert.length} пользователей`);
    } else {
      console.log('Все пользователи уже существуют');
    }

    // Получение ID пользователей и ролей
    const users = await db('users')
      .whereIn('email', ['admin@motoshop.ru', 'manager@motoshop.ru', 'user@example.com'])
      .select('id', 'email');
    
    const roles = await db('roles')
      .whereIn('name', ['admin', 'manager', 'customer'])
      .select('id', 'name');

    // Создание связей пользователей и ролей
    const userRolesToInsert = [];
    
    const adminUser = users.find(user => user.email === 'admin@motoshop.ru');
    const managerUser = users.find(user => user.email === 'manager@motoshop.ru');
    const customerUser = users.find(user => user.email === 'user@example.com');
    
    const adminRole = roles.find(role => role.name === 'admin');
    const managerRole = roles.find(role => role.name === 'manager');
    const customerRole = roles.find(role => role.name === 'customer');

    if (adminUser && adminRole) {
      const existingUserRole = await db('user_roles')
        .where({ user_id: adminUser.id, role_id: adminRole.id })
        .first();
      
      if (!existingUserRole) {
        userRolesToInsert.push({ user_id: adminUser.id, role_id: adminRole.id });
      }
    }

    if (managerUser && managerRole) {
      const existingUserRole = await db('user_roles')
        .where({ user_id: managerUser.id, role_id: managerRole.id })
        .first();
      
      if (!existingUserRole) {
        userRolesToInsert.push({ user_id: managerUser.id, role_id: managerRole.id });
      }
    }

    if (customerUser && customerRole) {
      const existingUserRole = await db('user_roles')
        .where({ user_id: customerUser.id, role_id: customerRole.id })
        .first();
      
      if (!existingUserRole) {
        userRolesToInsert.push({ user_id: customerUser.id, role_id: customerRole.id });
      }
    }

    if (userRolesToInsert.length > 0) {
      await db('user_roles').insert(userRolesToInsert);
      console.log(`Добавлено ${userRolesToInsert.length} связей пользователей и ролей`);
    } else {
      console.log('Все связи пользователей и ролей уже существуют');
    }

    // Создание настроек пользователей
    const userSettingsToInsert = [];
    
    for (const user of users) {
      const existingSettings = await db('user_settings')
        .where({ user_id: user.id })
        .first();
      
      if (!existingSettings) {
        userSettingsToInsert.push({
          user_id: user.id,
          theme: 'light',
          date_format: 'DD.MM.YYYY',
          items_per_page: 10,
          preferred_language: 'ru',
          notification_enabled: true
        });
      }
    }

    if (userSettingsToInsert.length > 0) {
      await db('user_settings').insert(userSettingsToInsert);
      console.log(`Добавлено ${userSettingsToInsert.length} настроек пользователей`);
    } else {
      console.log('Все настройки пользователей уже существуют');
    }

    console.log('База данных успешно заполнена');
  } catch (error) {
    console.error('Ошибка при заполнении базы данных:', error);
  } finally {
    // Закрытие соединения с базой данных
    db.destroy();
  }
}

seedDatabase();
