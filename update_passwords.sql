-- Обновление паролей для тестовых пользователей
-- Все пароли: admin123, manager123, user123

-- Хэш для пароля "admin123" / "manager123" / "user123"
-- Используем один и тот же хэш для простоты тестирования

UPDATE users 
SET password_hash = '$2a$10$LI0Td3MSreZz672WKlC6TeePTWXcRHfj2zqD8Q4CPdsO9IXjIvUEy',
    updated_at = CURRENT_TIMESTAMP
WHERE email IN ('admin@motoshop.ru', 'manager@motoshop.ru', 'user@example.com');

-- Проверка обновления
SELECT id, email, first_name, last_name, is_active 
FROM users 
WHERE email IN ('admin@motoshop.ru', 'manager@motoshop.ru', 'user@example.com');
