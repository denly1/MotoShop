import bcrypt from 'bcryptjs';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export async function seed(knex) {
  // Очистка таблиц
  await knex('user_roles').del();
  await knex('user_settings').del();
  await knex('users').del();
  
  // Хэширование паролей
  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('admin123', saltRounds);
  const managerPasswordHash = await bcrypt.hash('manager123', saltRounds);
  const userPasswordHash = await bcrypt.hash('user123', saltRounds);
  
  // Вставка пользователей
  const adminResult = await knex('users').insert({
    email: 'admin@motoshop.ru',
    password_hash: adminPasswordHash,
    first_name: 'Админ',
    last_name: 'Системы',
    phone: '+7 (999) 123-45-67',
    is_active: true
  }).returning('id');
  const adminId = adminResult[0].id || adminResult[0];
  
  const managerResult = await knex('users').insert({
    email: 'manager@motoshop.ru',
    password_hash: managerPasswordHash,
    first_name: 'Менеджер',
    last_name: 'Магазина',
    phone: '+7 (999) 765-43-21',
    is_active: true
  }).returning('id');
  const managerId = managerResult[0].id || managerResult[0];
  
  const userResult = await knex('users').insert({
    email: 'user@example.com',
    password_hash: userPasswordHash,
    first_name: 'Иван',
    last_name: 'Петров',
    phone: '+7 (999) 555-55-55',
    is_active: true
  }).returning('id');
  const userId = userResult[0].id || userResult[0];
  
  // Получение ID ролей
  const roles = await knex('roles').select('id', 'name');
  const adminRoleId = roles.find(role => role.name === 'admin').id;
  const managerRoleId = roles.find(role => role.name === 'manager').id;
  const customerRoleId = roles.find(role => role.name === 'customer').id;
  
  // Назначение ролей пользователям
  await knex('user_roles').insert([
    { user_id: adminId, role_id: adminRoleId },
    { user_id: managerId, role_id: managerRoleId },
    { user_id: userId, role_id: customerRoleId }
  ]);
  
  // Создание настроек пользователей
  await knex('user_settings').insert([
    {
      user_id: adminId,
      theme: 'dark',
      date_format: 'DD.MM.YYYY',
      items_per_page: 20,
      preferred_language: 'ru',
      notification_enabled: true
    },
    {
      user_id: managerId,
      theme: 'light',
      date_format: 'DD.MM.YYYY',
      items_per_page: 15,
      preferred_language: 'ru',
      notification_enabled: true
    },
    {
      user_id: userId,
      theme: 'light',
      date_format: 'DD.MM.YYYY',
      items_per_page: 10,
      preferred_language: 'ru',
      notification_enabled: true
    }
  ]);
}
