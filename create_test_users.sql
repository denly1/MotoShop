-- Создание тестовых пользователей для MotoShop
-- Пароль для всех: "password123"
-- Хэш: $2a$10$LI0Td3MSreZz672WKlC6TeePTWXcRHfj2zqD8Q4CPdsO9IXjIvUEy

-- Удаляем существующих тестовых пользователей (если есть)
DELETE FROM user_settings WHERE user_id IN (
  SELECT id FROM users WHERE email IN ('admin@motoshop.ru', 'manager@motoshop.ru', 'user@motoshop.ru')
);

DELETE FROM user_roles WHERE user_id IN (
  SELECT id FROM users WHERE email IN ('admin@motoshop.ru', 'manager@motoshop.ru', 'user@motoshop.ru')
);

DELETE FROM users WHERE email IN ('admin@motoshop.ru', 'manager@motoshop.ru', 'user@motoshop.ru');

-- Создаем пользователей
INSERT INTO users (email, password_hash, first_name, last_name, phone, is_active) VALUES
('admin@motoshop.ru', '$2a$10$LI0Td3MSreZz672WKlC6TeePTWXcRHfj2zqD8Q4CPdsO9IXjIvUEy', 'Админ', 'Админов', '+79991234567', true),
('manager@motoshop.ru', '$2a$10$LI0Td3MSreZz672WKlC6TeePTWXcRHfj2zqD8Q4CPdsO9IXjIvUEy', 'Менеджер', 'Менеджеров', '+79991234568', true),
('user@motoshop.ru', '$2a$10$LI0Td3MSreZz672WKlC6TeePTWXcRHfj2zqD8Q4CPdsO9IXjIvUEy', 'Пользователь', 'Пользователев', '+79991234569', true);

-- Назначаем роли
-- Admin
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'admin@motoshop.ru' AND r.name = 'admin';

-- Manager
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'manager@motoshop.ru' AND r.name = 'manager';

-- Customer
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'user@motoshop.ru' AND r.name = 'customer';

-- Создаем настройки пользователей
INSERT INTO user_settings (user_id, theme, date_format, items_per_page, preferred_language, notification_enabled)
SELECT id, 'light', 'DD.MM.YYYY', 10, 'ru', true
FROM users
WHERE email IN ('admin@motoshop.ru', 'manager@motoshop.ru', 'user@motoshop.ru');

-- Проверяем созданных пользователей
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  r.name as role,
  u.is_active
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email IN ('admin@motoshop.ru', 'manager@motoshop.ru', 'user@motoshop.ru')
ORDER BY u.email;
