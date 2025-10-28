-- ===== ИСПРАВЛЕНИЕ БАЗЫ ДАННЫХ =====

-- 1. Обновление паролей для тестовых пользователей
UPDATE users 
SET password_hash = '$2a$10$LI0Td3MSreZz672WKlC6TeePTWXcRHfj2zqD8Q4CPdsO9IXjIvUEy',
    updated_at = CURRENT_TIMESTAMP
WHERE email IN ('admin@motoshop.ru', 'manager@motoshop.ru', 'user@example.com');

-- 2. Проверка обновления
SELECT id, email, first_name, last_name, is_active 
FROM users 
WHERE email IN ('admin@motoshop.ru', 'manager@motoshop.ru', 'user@example.com');

-- 3. Проверка ролей пользователей
SELECT u.email, r.name as role
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email IN ('admin@motoshop.ru', 'manager@motoshop.ru', 'user@example.com')
ORDER BY u.email, r.name;

-- 4. Проверка категорий
SELECT COUNT(*) as total_categories FROM categories;

-- 5. Проверка товаров
SELECT COUNT(*) as total_products FROM products;

-- 6. Проверка инвентаря
SELECT COUNT(*) as total_inventory FROM inventory;

-- 7. Если данных нет, добавляем их заново
-- Роли (если их нет)
INSERT INTO roles (name, description)
VALUES 
  ('admin', 'Администратор системы с полным доступом ко всем функциям'),
  ('manager', 'Менеджер с доступом к управлению товарами и заказами'),
  ('customer', 'Зарегистрированный покупатель'),
  ('guest', 'Гость с ограниченным доступом')
ON CONFLICT (name) DO NOTHING;

-- Пользователи (если их нет)
INSERT INTO users (email, password_hash, first_name, last_name, phone, is_active)
VALUES 
  ('admin@motoshop.ru', '$2a$10$LI0Td3MSreZz672WKlC6TeePTWXcRHfj2zqD8Q4CPdsO9IXjIvUEy', 'Админ', 'Системы', '+7 (999) 123-45-67', true),
  ('manager@motoshop.ru', '$2a$10$LI0Td3MSreZz672WKlC6TeePTWXcRHfj2zqD8Q4CPdsO9IXjIvUEy', 'Менеджер', 'Магазина', '+7 (999) 765-43-21', true),
  ('user@example.com', '$2a$10$LI0Td3MSreZz672WKlC6TeePTWXcRHfj2zqD8Q4CPdsO9IXjIvUEy', 'Иван', 'Петров', '+7 (999) 555-55-55', true)
ON CONFLICT (email) DO NOTHING;

-- Назначение ролей
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE (u.email = 'admin@motoshop.ru' AND r.name = 'admin')
   OR (u.email = 'manager@motoshop.ru' AND r.name = 'manager')
   OR (u.email = 'user@example.com' AND r.name = 'customer')
ON CONFLICT DO NOTHING;

-- Настройки пользователей
INSERT INTO user_settings (user_id, theme, date_format, items_per_page, preferred_language, notification_enabled)
SELECT u.id, 'light', 'DD.MM.YYYY', 10, 'ru', true
FROM users u
WHERE u.email IN ('admin@motoshop.ru', 'manager@motoshop.ru', 'user@example.com')
ON CONFLICT (user_id) DO NOTHING;

-- Категории
INSERT INTO categories (name, slug, description, image_url, is_active)
VALUES 
  ('Мотоциклы', 'motorcycles', 'Все виды мотоциклов для дорог и бездорожья', '/images/categories/motorcycles.jpg', true),
  ('Экипировка', 'gear', 'Защитная экипировка для мотоциклистов', '/images/categories/gear.jpg', true),
  ('Запчасти', 'parts', 'Запасные части для мотоциклов', '/images/categories/parts.jpg', true),
  ('Аксессуары', 'accessories', 'Аксессуары для мотоциклов и мотоциклистов', '/images/categories/accessories.jpg', true)
ON CONFLICT (slug) DO NOTHING;

-- Подкатегории
INSERT INTO categories (name, slug, description, parent_id, image_url, is_active)
SELECT 
  subcat.name, 
  subcat.slug, 
  subcat.description, 
  c.id as parent_id, 
  subcat.image_url, 
  true
FROM (
  VALUES 
    ('Спортивные', 'sport-bikes', 'Спортивные мотоциклы для высоких скоростей', 'motorcycles', '/images/categories/sport-bikes.jpg'),
    ('Круизеры', 'cruisers', 'Комфортные мотоциклы для дальних поездок', 'motorcycles', '/images/categories/cruisers.jpg'),
    ('Эндуро', 'enduro', 'Мотоциклы для бездорожья и приключений', 'motorcycles', '/images/categories/enduro.jpg'),
    ('Шлемы', 'helmets', 'Защитные шлемы для мотоциклистов', 'gear', '/images/categories/helmets.jpg'),
    ('Куртки', 'jackets', 'Мотоциклетные куртки с защитой', 'gear', '/images/categories/jackets.jpg'),
    ('Перчатки', 'gloves', 'Защитные перчатки для мотоциклистов', 'gear', '/images/categories/gloves.jpg'),
    ('Двигатель', 'engine-parts', 'Запчасти для двигателя мотоцикла', 'parts', '/images/categories/engine-parts.jpg'),
    ('Тормозная система', 'brake-system', 'Компоненты тормозной системы', 'parts', '/images/categories/brake-system.jpg'),
    ('Электрика', 'electrical', 'Электрические компоненты для мотоциклов', 'parts', '/images/categories/electrical.jpg'),
    ('Багаж', 'luggage', 'Системы хранения для мотоциклов', 'accessories', '/images/categories/luggage.jpg'),
    ('Защита', 'protection', 'Защитные аксессуары для мотоциклов', 'accessories', '/images/categories/protection.jpg'),
    ('Электроника', 'electronics', 'Электронные аксессуары для мотоциклистов', 'accessories', '/images/categories/electronics.jpg')
) as subcat(name, slug, description, parent_slug, image_url)
JOIN categories c ON c.slug = subcat.parent_slug
ON CONFLICT (slug) DO NOTHING;

-- Товары
INSERT INTO products (name, slug, sku, description, price, old_price, image_url, is_active, is_featured, brand, weight, dimensions)
VALUES 
  ('Yamaha YZF-R1', 'yamaha-yzf-r1', 'MOTO-001', 'Спортивный мотоцикл с мощным двигателем 998 куб.см. Идеален для трека и скоростной езды.', 1250000, 1350000, '/images/products/yamaha-r1.jpg', true, true, 'Yamaha', 200, '2055x730x1150'),
  ('Harley-Davidson Road King', 'harley-davidson-road-king', 'MOTO-002', 'Классический круизер для комфортных путешествий на дальние расстояния.', 1800000, null, '/images/products/harley-road-king.jpg', true, true, 'Harley-Davidson', 375, '2420x960x1385'),
  ('BMW R 1250 GS Adventure', 'bmw-r-1250-gs-adventure', 'MOTO-003', 'Туристический эндуро для путешествий по любым дорогам и бездорожью.', 1650000, 1750000, '/images/products/bmw-gs.jpg', true, true, 'BMW', 268, '2270x980x1460'),
  ('Шлем AGV K6', 'agv-k6-helmet', 'GEAR-001', 'Легкий спортивный шлем с отличной аэродинамикой и вентиляцией.', 45000, 48000, '/images/products/agv-k6.jpg', true, false, 'AGV', 1.4, '35x25x25'),
  ('Куртка Dainese Super Speed 3', 'dainese-super-speed-3', 'GEAR-002', 'Спортивная кожаная куртка с защитными вставками и аэродинамическим горбом.', 52000, null, '/images/products/dainese-jacket.jpg', true, false, 'Dainese', 3.2, '60x40x10'),
  ('Перчатки Alpinestars GP Pro R3', 'alpinestars-gp-pro-r3', 'GEAR-003', 'Спортивные перчатки с защитой костяшек и ладони.', 12000, 15000, '/images/products/alpinestars-gloves.jpg', true, false, 'Alpinestars', 0.3, '25x15x5'),
  ('Масляный фильтр HF204', 'oil-filter-hf204', 'PART-001', 'Высококачественный масляный фильтр для мотоциклов Honda, Kawasaki, Yamaha.', 800, null, '/images/products/oil-filter.jpg', true, false, 'HiFlo', 0.1, '10x10x10'),
  ('Тормозные колодки Brembo 07BB33SA', 'brembo-brake-pads-07bb33sa', 'PART-002', 'Спортивные тормозные колодки для мотоциклов с высокими характеристиками.', 3500, 4000, '/images/products/brembo-pads.jpg', true, false, 'Brembo', 0.5, '15x10x5'),
  ('Аккумулятор Yuasa YTX14-BS', 'yuasa-battery-ytx14-bs', 'PART-003', 'Необслуживаемый аккумулятор для мотоциклов.', 6500, null, '/images/products/yuasa-battery.jpg', true, false, 'Yuasa', 4.2, '15x8x17'),
  ('Кофр GIVI E52', 'givi-e52-top-case', 'ACC-001', 'Вместительный центральный кофр для мотоцикла объемом 52 литра.', 18000, 20000, '/images/products/givi-case.jpg', true, false, 'GIVI', 5.5, '60x45x30'),
  ('Слайдеры R&G для Honda CBR', 'rg-frame-sliders-honda-cbr', 'ACC-002', 'Защитные слайдеры для рамы мотоцикла Honda CBR.', 5500, null, '/images/products/frame-sliders.jpg', true, false, 'R&G', 0.8, '20x15x10'),
  ('Навигатор Garmin Zumo XT', 'garmin-zumo-xt', 'ACC-003', 'Мотоциклетный GPS-навигатор с 5.5" дисплеем и защитой от влаги.', 42000, 45000, '/images/products/garmin-zumo.jpg', true, false, 'Garmin', 0.4, '14x8x2')
ON CONFLICT (slug) DO NOTHING;

-- Связь товаров с категориями
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id
FROM products p
CROSS JOIN categories c
WHERE (p.slug = 'yamaha-yzf-r1' AND c.slug IN ('motorcycles', 'sport-bikes'))
   OR (p.slug = 'harley-davidson-road-king' AND c.slug IN ('motorcycles', 'cruisers'))
   OR (p.slug = 'bmw-r-1250-gs-adventure' AND c.slug IN ('motorcycles', 'enduro'))
   OR (p.slug = 'agv-k6-helmet' AND c.slug IN ('gear', 'helmets'))
   OR (p.slug = 'dainese-super-speed-3' AND c.slug IN ('gear', 'jackets'))
   OR (p.slug = 'alpinestars-gp-pro-r3' AND c.slug IN ('gear', 'gloves'))
   OR (p.slug = 'oil-filter-hf204' AND c.slug IN ('parts', 'engine-parts'))
   OR (p.slug = 'brembo-brake-pads-07bb33sa' AND c.slug IN ('parts', 'brake-system'))
   OR (p.slug = 'yuasa-battery-ytx14-bs' AND c.slug IN ('parts', 'electrical'))
   OR (p.slug = 'givi-e52-top-case' AND c.slug IN ('accessories', 'luggage'))
   OR (p.slug = 'rg-frame-sliders-honda-cbr' AND c.slug IN ('accessories', 'protection'))
   OR (p.slug = 'garmin-zumo-xt' AND c.slug IN ('accessories', 'electronics'))
ON CONFLICT DO NOTHING;

-- Инвентарь
INSERT INTO inventory (product_id, quantity, reserved_quantity, warehouse)
SELECT p.id, 
       CASE 
         WHEN p.slug IN ('yamaha-yzf-r1', 'harley-davidson-road-king', 'bmw-r-1250-gs-adventure') THEN 5
         ELSE 20
       END, 
       0, 
       'main'
FROM products p
ON CONFLICT DO NOTHING;

-- Финальная проверка
SELECT 'Пользователи:' as info, COUNT(*) as count FROM users
UNION ALL
SELECT 'Роли:', COUNT(*) FROM roles
UNION ALL
SELECT 'Категории:', COUNT(*) FROM categories
UNION ALL
SELECT 'Товары:', COUNT(*) FROM products
UNION ALL
SELECT 'Инвентарь:', COUNT(*) FROM inventory;
