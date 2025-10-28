# ПРИЛОЖЕНИЕ А. ТЕКСТ ПРОГРАММЫ - ЧАСТЬ 1: BACKEND

## 1. ОБЩИЕ СВЕДЕНИЯ

**Наименование программы:** MotoShop - Интернет-магазин мототехники

**Назначение:** Веб-приложение для продажи мототехники с административной панелью управления

**Технологический стек:**
- **Frontend:** React 18, Vite, TailwindCSS, React Router, Axios
- **Backend:** Node.js, Express.js, JWT, bcrypt
- **Database:** PostgreSQL 14+, Knex.js

**Язык программирования:** JavaScript (ES6+)

**Среда разработки:** Visual Studio Code

---

## 2. МОДУЛИ BACKEND

### Таблица 1 – Модули Backend

| № | Имя модуля | Тип | Размер | Назначение |
|---|------------|-----|--------|------------|
| 1 | server.js | JS | 150 строк | Главный файл сервера |
| 2 | authController.js | JS | 200 строк | Аутентификация |
| 3 | simpleDashboard.js | JS | 250 строк | Статистика |
| 4 | productController.js | JS | 350 строк | CRUD товаров |
| 5 | orderController.js | JS | 280 строк | Заказы |
| 6 | userController.js | JS | 220 строк | Пользователи |
| 7 | exportController.js | JS | 400 строк | Экспорт CSV |
| 8 | authMiddleware.js | JS | 50 строк | JWT проверка |
| 9 | roleMiddleware.js | JS | 80 строк | Проверка ролей |

---

## 3. ОПИСАНИЕ МОДУЛЕЙ

### 3.1. server.js - Главный файл сервера

**Назначение:** Инициализация Express, настройка middleware, маршруты

**Основные функции:**
- Настройка CORS
- Парсинг JSON
- Подключение маршрутов
- Запуск сервера на порту 3003

**Код:**
```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import db from './db/index.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

db.raw('SELECT 1')
  .then(() => console.log('✅ БД подключена'))
  .catch((err) => console.error('❌ Ошибка БД:', err));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'MotoShop API' });
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер: http://localhost:${PORT}`);
});
```

---

### 3.2. authController.js - Аутентификация

**Назначение:** Регистрация, авторизация, получение данных пользователя

**Функции:**
- `register` - Регистрация
- `login` - Авторизация
- `getCurrentUser` - Данные пользователя

**Код:**
```javascript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../../db/index.js';

// Регистрация
export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Email уже используется' 
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [userId] = await db('users').insert({
      email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      phone,
      is_active: true
    }).returning('id');

    const customerRole = await db('roles')
      .where({ name: 'customer' }).first();
    
    await db('user_roles').insert({
      user_id: userId.id,
      role_id: customerRole.id
    });

    res.status(201).json({ 
      message: 'Регистрация успешна' 
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Авторизация
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db('users').where({ email }).first();
    if (!user) {
      return res.status(401).json({ 
        message: 'Неверный email или пароль' 
      });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ 
        message: 'Неверный email или пароль' 
      });
    }

    const roles = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', user.id)
      .select('roles.name');

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roles: roles.map(r => r.name)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};
```

---

### 3.3. simpleDashboard.js - Статистика

**Назначение:** Получение статистики для админ-панели

**Функции:**
- Подсчет заказов
- Расчет выручки
- Подсчет пользователей
- Подсчет товаров

**Код:**
```javascript
import db from '../../db/index.js';

export const getSimpleDashboardStats = async (req, res) => {
  try {
    const stats = {
      total: { orders: 0, revenue: 0, users: 0, products: 0 }
    };
    
    // Заказы
    const ordersCount = await db('orders').count('* as count').first();
    stats.total.orders = parseInt(ordersCount?.count || 0);
    
    // Выручка
    const revenue = await db('orders')
      .whereNot('status', 'cancelled')
      .sum('total_amount as total')
      .first();
    stats.total.revenue = parseFloat(revenue?.total || 0);
    
    // Пользователи
    const usersCount = await db('users').count('* as count').first();
    stats.total.users = parseInt(usersCount?.count || 0);
    
    // Товары
    const productsCount = await db('products').count('* as count').first();
    stats.total.products = parseInt(productsCount?.count || 0);

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка получения статистики' 
    });
  }
};
```

---

### 3.4. productController.js - Управление товарами

**Назначение:** CRUD операции с товарами

**Функции:**
- `getAllProducts` - Список товаров
- `getProductBySlug` - Товар по slug
- `createProduct` - Создание
- `updateProduct` - Обновление
- `deleteProduct` - Удаление

**Код (основные функции):**
```javascript
import db from '../../db/index.js';

// Получение всех товаров
export const getAllProducts = async (req, res) => {
  try {
    const { search, category } = req.query;
    
    let query = db('products').where('is_active', true);
    
    if (search) {
      query = query.where('name', 'ilike', `%${search}%`);
    }
    
    if (category) {
      query = query
        .join('product_categories', 'products.id', 'product_categories.product_id')
        .where('product_categories.category_id', category);
    }
    
    const products = await query.orderBy('created_at', 'desc');
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Создание товара
export const createProduct = async (req, res) => {
  try {
    const { name, sku, price, brand, description } = req.body;
    
    const slug = name.toLowerCase()
      .replace(/[^a-zа-я0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const [product] = await db('products').insert({
      name, slug, sku, price, brand, description,
      is_active: true
    }).returning('*');
    
    res.status(201).json({ product });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка создания' });
  }
};
```

---

### 3.5. authMiddleware.js - JWT проверка

**Назначение:** Проверка токенов авторизации

**Код:**
```javascript
import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      message: 'Требуется авторизация' 
    });
  }

  try {
    const user = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'secret'
    );
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ 
      message: 'Недействительный токен' 
    });
  }
};
```

---

### 3.6. roleMiddleware.js - Проверка ролей

**Назначение:** Проверка прав доступа

**Код:**
```javascript
import db from '../db/index.js';

export const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userRoles = await db('user_roles')
        .join('roles', 'user_roles.role_id', 'roles.id')
        .where('user_roles.user_id', req.user.userId)
        .select('roles.name');
      
      const roleNames = userRoles.map(r => r.name);
      const hasPermission = allowedRoles.some(
        role => roleNames.includes(role)
      );
      
      if (!hasPermission) {
        return res.status(403).json({ 
          message: 'Доступ запрещен' 
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  };
};
```

---

## 4. ИТОГИ BACKEND

**Общее количество модулей:** 9
**Общее количество строк:** ~2,580
**Основные технологии:** Node.js, Express, JWT, bcrypt, Knex.js
**База данных:** PostgreSQL 14+
