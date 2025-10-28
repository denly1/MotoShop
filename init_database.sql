-- Создание таблицы ролей
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT
);

-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы связи пользователей и ролей
CREATE TABLE IF NOT EXISTS user_roles (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- Создание таблицы настроек пользователей
CREATE TABLE IF NOT EXISTS user_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'light',
  date_format VARCHAR(20) DEFAULT 'DD.MM.YYYY',
  items_per_page INTEGER DEFAULT 10,
  preferred_language VARCHAR(10) DEFAULT 'ru',
  notification_enabled BOOLEAN DEFAULT true
);

-- Заполнение таблицы ролей
INSERT INTO roles (name, description)
VALUES 
  ('admin', 'Администратор системы с полным доступом ко всем функциям'),
  ('manager', 'Менеджер с доступом к управлению товарами и заказами'),
  ('customer', 'Зарегистрированный покупатель'),
  ('guest', 'Гость с ограниченным доступом')
ON CONFLICT (name) DO NOTHING;

-- Заполнение таблицы пользователей
INSERT INTO users (email, password_hash, first_name, last_name, phone, is_active)
VALUES 
  ('admin@motoshop.ru', '$2a$10$JfVdOD5Wg1HQpqX2.8AwNOXGoVHtF2kUE.uP5xyTvGIGvns1t8rAe', 'Админ', 'Системы', '+7 (999) 123-45-67', true),
  ('manager@motoshop.ru', '$2a$10$JfVdOD5Wg1HQpqX2.8AwNOXGoVHtF2kUE.uP5xyTvGIGvns1t8rAe', 'Менеджер', 'Магазина', '+7 (999) 765-43-21', true),
  ('user@example.com', '$2a$10$JfVdOD5Wg1HQpqX2.8AwNOXGoVHtF2kUE.uP5xyTvGIGvns1t8rAe', 'Иван', 'Петров', '+7 (999) 555-55-55', true)
ON CONFLICT (email) DO NOTHING;

-- Назначение ролей пользователям
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE (u.email = 'admin@motoshop.ru' AND r.name = 'admin')
   OR (u.email = 'manager@motoshop.ru' AND r.name = 'manager')
   OR (u.email = 'user@example.com' AND r.name = 'customer')
ON CONFLICT DO NOTHING;

-- Создание настроек пользователей
INSERT INTO user_settings (user_id, theme, date_format, items_per_page, preferred_language, notification_enabled)
SELECT u.id, 'light', 'DD.MM.YYYY', 10, 'ru', true
FROM users u
WHERE u.email IN ('admin@motoshop.ru', 'manager@motoshop.ru', 'user@example.com')
ON CONFLICT (user_id) DO NOTHING;
