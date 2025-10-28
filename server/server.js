import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, testConnection, setUserForAudit } from './db/index.js';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import csvParser from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';

// Импорт маршрутов админ-панели
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

// Инициализация переменных окружения
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Role', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статическая папка для изображений
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Настройка хранилища для загрузки файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Настройка транспорта для отправки писем через Mail.ru
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false // Позволяет подключаться к серверам с самоподписанными сертификатами
  }
});

// Проверка подключения к SMTP
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Ошибка подключения к SMTP:', error);
  } else {
    console.log('✅ SMTP сервер готов к отправке писем');
  }
});

// Функция форматирования цены
const formatPrice = (price) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(price);
};

// Middleware для аутентификации
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Недействительный токен' });
    }
    req.user = user;
    
    // Установка ID пользователя для аудита
    setUserForAudit(user.id).catch(err => {
      console.error('Ошибка при установке ID пользователя для аудита:', err);
    });
    
    next();
  });
};

// Middleware для проверки роли
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    if (!Array.isArray(req.user.roles)) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    
    const hasRole = req.user.roles.some(role => roles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    
    next();
  };
};

// Генерация HTML для письма
const generateOrderEmail = (orderData) => {
  const { formData, cartItems, total, orderNumber, orderDate } = orderData;
  
  const itemsHTML = cartItems.map(item => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 15px;">
        <strong>${item.name}</strong><br>
        <small style="color: #666;">${item.category}</small>
      </td>
      <td style="padding: 15px; text-align: center;">${item.quantity} шт.</td>
      <td style="padding: 15px; text-align: right;">${formatPrice(item.price)}</td>
      <td style="padding: 15px; text-align: right;"><strong>${formatPrice(item.price * item.quantity)}</strong></td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Заказ #${orderNumber}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1d3557 0%, #457b9d 100%); padding: 30px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 32px;">🏍️ MotoShop</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Спасибо за ваш заказ!</p>
                </td>
              </tr>

              <!-- Order Info -->
              <tr>
                <td style="padding: 30px;">
                  <div style="background-color: #e63946; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="margin: 0; font-size: 24px;">Заказ #${orderNumber}</h2>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">Дата: ${orderDate}</p>
                  </div>

                  <h3 style="color: #1d3557; margin-bottom: 15px;">Информация о заказчике:</h3>
                  <table width="100%" cellpadding="5" style="margin-bottom: 20px;">
                    <tr>
                      <td style="color: #666; width: 150px;"><strong>Имя:</strong></td>
                      <td>${formData.firstName} ${formData.lastName}</td>
                    </tr>
                    <tr>
                      <td style="color: #666;"><strong>Email:</strong></td>
                      <td>${formData.email}</td>
                    </tr>
                    <tr>
                      <td style="color: #666;"><strong>Телефон:</strong></td>
                      <td>${formData.phone}</td>
                    </tr>
                    <tr>
                      <td style="color: #666;"><strong>Адрес:</strong></td>
                      <td>${formData.address}, ${formData.city}, ${formData.postalCode}</td>
                    </tr>
                    <tr>
                      <td style="color: #666;"><strong>Оплата:</strong></td>
                      <td>${formData.paymentMethod === 'card' ? '💳 Банковская карта' : '💵 Наличными при получении'}</td>
                    </tr>
                    ${formData.comments ? `
                    <tr>
                      <td style="color: #666;"><strong>Комментарий:</strong></td>
                      <td>${formData.comments}</td>
                    </tr>
                    ` : ''}
                  </table>

                  <h3 style="color: #1d3557; margin-bottom: 15px;">Состав заказа:</h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                    <thead>
                      <tr style="background-color: #1d3557; color: white;">
                        <th style="padding: 12px; text-align: left;">Товар</th>
                        <th style="padding: 12px; text-align: center;">Количество</th>
                        <th style="padding: 12px; text-align: right;">Цена</th>
                        <th style="padding: 12px; text-align: right;">Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHTML}
                    </tbody>
                  </table>

                  <table width="100%" style="margin-top: 20px;">
                    <tr>
                      <td style="text-align: right; padding: 10px; color: #666;">
                        <strong>Товары:</strong>
                      </td>
                      <td style="text-align: right; padding: 10px; width: 150px;">
                        ${formatPrice(total)}
                      </td>
                    </tr>
                    <tr>
                      <td style="text-align: right; padding: 10px; color: #666;">
                        <strong>Доставка:</strong>
                      </td>
                      <td style="text-align: right; padding: 10px; color: #06d6a0; font-weight: bold;">
                        Бесплатно
                      </td>
                    </tr>
                    <tr style="border-top: 2px solid #1d3557;">
                      <td style="text-align: right; padding: 15px; font-size: 20px; color: #1d3557;">
                        <strong>ИТОГО:</strong>
                      </td>
                      <td style="text-align: right; padding: 15px; font-size: 24px; color: #e63946; font-weight: bold;">
                        ${formatPrice(total)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                  <p style="margin: 0; color: #666; font-size: 14px;">
                    Мы свяжемся с вами в ближайшее время для подтверждения заказа.
                  </p>
                  <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
                    📞 +7 (800) 555-35-35 | 📧 info@motoshop.ru | 📍 Москва, ул. Мотоциклистов, 1
                  </p>
                  <p style="margin: 15px 0 0 0; color: #999; font-size: 12px;">
                    © 2025 MotoShop. Все права защищены.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};
// ============= API ROUTES =============

// ===== Аутентификация =====

// Регистрация нового пользователя
app.post('/api/auth/register', [
  body('email').isEmail().withMessage('Введите корректный email'),
  body('password').isLength({ min: 6 }).withMessage('Пароль должен содержать минимум 6 символов'),
  body('firstName').notEmpty().withMessage('Введите имя'),
  body('lastName').notEmpty().withMessage('Введите фамилию')
], async (req, res) => {
  try {
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password, firstName, lastName, phone } = req.body;
    
    // Проверка, существует ли пользователь с таким email
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }
    
    // Хэширование пароля
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Транзакция для создания пользователя и назначения роли
    await db.transaction(async trx => {
      // Создание пользователя
      const [newUser] = await trx('users').insert({
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        is_active: true
      }).returning('id');
      
      const userId = newUser.id || newUser;
      
      // Получение ID роли "customer"
      const customerRole = await trx('roles').where({ name: 'customer' }).first();
      if (!customerRole) {
        throw new Error('Роль "customer" не найдена');
      }
      
      // Назначение роли пользователю
      await trx('user_roles').insert({
        user_id: userId,
        role_id: customerRole.id
      });
      
      // Создание настроек пользователя
      await trx('user_settings').insert({
        user_id: userId,
        theme: 'light',
        date_format: 'DD.MM.YYYY',
        items_per_page: 10,
        preferred_language: 'ru',
        notification_enabled: true
      });
    });
    
    res.status(201).json({
      success: true,
      message: 'Пользователь успешно зарегистрирован'
    });
    
  } catch (error) {
    console.error('❌ Ошибка при регистрации пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при регистрации пользователя',
      error: error.message
    });
  }
});

// Вход в систему
app.post('/api/auth/login', [
  body('email').isEmail().withMessage('Введите корректный email'),
  body('password').notEmpty().withMessage('Введите пароль')
], async (req, res) => {
  try {
    console.log('✅ Получен запрос на вход в систему:', req.body);
    
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Ошибка валидации:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password } = req.body;
    console.log('✅ Получены данные:', { email });
    
    // Проверка подключения к базе данных
    try {
      await db.raw('SELECT 1');
      console.log('✅ Подключение к базе данных успешно');
    } catch (dbError) {
      console.error('❌ Ошибка подключения к базе данных:', dbError);
      throw new Error('Ошибка подключения к базе данных');
    }
    
    // Поиск пользователя по email
    console.log('✅ Поиск пользователя по email:', email);
    const user = await db('users').where({ email }).first();
    console.log('✅ Результат поиска пользователя:', user ? 'Найден' : 'Не найден');
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    // Проверка активности пользователя
    if (!user.is_active) {
      return res.status(403).json({ error: 'Аккаунт заблокирован' });
    }
    
    // Проверка пароля
    console.log('✅ Проверка пароля');
    try {
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      console.log('✅ Результат проверки пароля:', passwordMatch ? 'Совпадает' : 'Не совпадает');
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Неверный email или пароль' });
      }
    } catch (bcryptError) {
      console.error('❌ Ошибка при проверке пароля:', bcryptError);
      throw new Error('Ошибка при проверке пароля');
    }
    
    // Получение ролей пользователя
    console.log('✅ Получение ролей пользователя');
    try {
      const userRoles = await db('user_roles')
        .join('roles', 'user_roles.role_id', 'roles.id')
        .where('user_roles.user_id', user.id)
        .select('roles.name');
      
      const roles = userRoles.map(role => role.name);
      console.log('✅ Роли пользователя:', roles);
      
      // Создание JWT токена для аутентификации
      console.log('✅ Создание JWT токена');
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          roles: roles
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
      );
      console.log('✅ JWT токен создан');
      
      // Получение настроек пользователя
      console.log('✅ Получение настроек пользователя');
      const settings = await db('user_settings').where({ user_id: user.id }).first();
      console.log('✅ Настройки пользователя:', settings ? 'Найдены' : 'Не найдены');
      
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          roles,
          settings
        }
      });
      console.log('✅ Успешный вход в систему');
    } catch (rolesError) {
      console.error('❌ Ошибка при получении ролей:', rolesError);
      throw new Error('Ошибка при получении ролей');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при входе в систему:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при входе в систему',
      error: error.message
    });
  }
});

// Получение профиля пользователя
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Получение данных пользователя
    const user = await db('users').where({ id: userId }).first();
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Получение ролей пользователя
    const userRoles = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', userId)
      .select('roles.name');
    
    const roles = userRoles.map(role => role.name);
    
    // Получение настроек пользователя
    const settings = await db('user_settings').where({ user_id: userId }).first();
    
    // Получение заказов пользователя
    const orders = await db('orders')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .select('id', 'order_number', 'status', 'total_amount', 'created_at');
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        roles,
        settings,
        orders
      }
    });
    
  } catch (error) {
    console.error('❌ Ошибка при получении профиля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении профиля',
      error: error.message
    });
  }
});

// Обновление профиля пользователя
app.put('/api/auth/profile', authenticateToken, [
  body('firstName').optional().notEmpty().withMessage('Имя не может быть пустым'),
  body('lastName').optional().notEmpty().withMessage('Фамилия не может быть пустой'),
  body('phone').optional()
], async (req, res) => {
  try {
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const userId = req.user.id;
    const { firstName, lastName, phone } = req.body;
    
    // Обновление данных пользователя
    await db('users')
      .where({ id: userId })
      .update({
        first_name: firstName,
        last_name: lastName,
        phone,
        updated_at: db.fn.now()
      });
    
    res.json({
      success: true,
      message: 'Профиль успешно обновлен'
    });
    
  } catch (error) {
    console.error('❌ Ошибка при обновлении профиля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении профиля',
      error: error.message
    });
  }
});

// Обновление настроек пользователя
app.put('/api/auth/settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { theme, dateFormat, itemsPerPage, preferredLanguage, notificationEnabled } = req.body;
    
    // Обновление настроек пользователя
    await db('user_settings')
      .where({ user_id: userId })
      .update({
        theme: theme || 'light',
        date_format: dateFormat || 'DD.MM.YYYY',
        items_per_page: itemsPerPage || 10,
        preferred_language: preferredLanguage || 'ru',
        notification_enabled: notificationEnabled !== undefined ? notificationEnabled : true,
        updated_at: db.fn.now()
      });
    
    res.json({
      success: true,
      message: 'Настройки успешно обновлены'
    });
    
  } catch (error) {
    console.error('❌ Ошибка при обновлении настроек:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении настроек',
      error: error.message
    });
  }
});

// Смена пароля
app.put('/api/auth/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Введите текущий пароль'),
  body('newPassword').isLength({ min: 6 }).withMessage('Новый пароль должен содержать минимум 6 символов')
], async (req, res) => {
  try {
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    // Получение текущего пароля пользователя
    const user = await db('users').where({ id: userId }).first();
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Проверка текущего пароля
    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Неверный текущий пароль' });
    }
    
    // Хэширование нового пароля
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Обновление пароля
    await db('users')
      .where({ id: userId })
      .update({
        password_hash: newPasswordHash,
        updated_at: db.fn.now()
      });
    
    res.json({
      success: true,
      message: 'Пароль успешно изменен'
    });
    
  } catch (error) {
    console.error('❌ Ошибка при смене пароля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при смене пароля',
      error: error.message
    });
  }
});

// ===== Категории =====

// Получение всех категорий
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await db('categories')
      .where({ is_active: true })
      .orderBy('name');
    
    res.json({
      success: true,
      categories
    });
    
  } catch (error) {
    console.error('❌ Ошибка при получении категорий:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении категорий',
      error: error.message
    });
  }
});

// Получение категории по ID или slug
app.get('/api/categories/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    
    // Поиск категории по ID или slug
    let category;
    
    if (isNaN(idOrSlug)) {
      // Если это slug
      category = await db('categories').where({ slug: idOrSlug }).first();
    } else {
      // Если это ID
      category = await db('categories').where({ id: idOrSlug }).first();
    }
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Категория не найдена'
      });
    }
    
    // Получение подкатегорий
    const subcategories = await db('categories')
      .where({ parent_id: category.id, is_active: true })
      .orderBy('name');
    
    // Получение товаров в категории
    const products = await db('products')
      .join('product_categories', 'products.id', 'product_categories.product_id')
      .where('product_categories.category_id', category.id)
      .where('products.is_active', true)
      .select('products.*');
    
    res.json({
      success: true,
      category: {
        ...category,
        subcategories,
        products
      }
    });
    
  } catch (error) {
    console.error('❌ Ошибка при получении категории:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении категории',
      error: error.message
    });
  }
});

// Создание категории (только для админов и менеджеров)
app.post('/api/categories', authenticateToken, checkRole(['admin', 'manager']), [
  body('name').notEmpty().withMessage('Введите название категории'),
  body('slug').notEmpty().withMessage('Введите slug категории')
], async (req, res) => {
  try {
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, slug, description, parentId, imageUrl } = req.body;
    
    // Проверка уникальности slug
    const existingCategory = await db('categories').where({ slug }).first();
    if (existingCategory) {
      return res.status(400).json({ error: 'Категория с таким slug уже существует' });
    }
    
    // Создание категории
    const [categoryId] = await db('categories').insert({
      name,
      slug,
      description,
      parent_id: parentId || null,
      image_url: imageUrl || null,
      is_active: true
    }).returning('id');
    
    res.status(201).json({
      success: true,
      message: 'Категория успешно создана',
      categoryId
    });
    
  } catch (error) {
    console.error('❌ Ошибка при создании категории:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при создании категории',
      error: error.message
    });
  }
});

// Обновление категории (только для админов и менеджеров)
app.put('/api/categories/:id', authenticateToken, checkRole(['admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, parentId, imageUrl, isActive } = req.body;
    
    // Проверка существования категории
    const category = await db('categories').where({ id }).first();
    if (!category) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    
    // Проверка уникальности slug, если он изменился
    if (slug && slug !== category.slug) {
      const existingCategory = await db('categories').where({ slug }).first();
      if (existingCategory) {
        return res.status(400).json({ error: 'Категория с таким slug уже существует' });
      }
    }
    
    // Обновление категории
    await db('categories')
      .where({ id })
      .update({
        name: name || category.name,
        slug: slug || category.slug,
        description: description !== undefined ? description : category.description,
        parent_id: parentId !== undefined ? parentId : category.parent_id,
        image_url: imageUrl !== undefined ? imageUrl : category.image_url,
        is_active: isActive !== undefined ? isActive : category.is_active,
        updated_at: db.fn.now()
      });
    
    res.json({
      success: true,
      message: 'Категория успешно обновлена'
    });
    
  } catch (error) {
    console.error('❌ Ошибка при обновлении категории:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении категории',
      error: error.message
    });
  }
});

// Удаление категории (только для админов)
app.delete('/api/categories/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверка существования категории
    const category = await db('categories').where({ id }).first();
    if (!category) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    
    // Проверка наличия подкатегорий
    const subcategories = await db('categories').where({ parent_id: id }).first();
    if (subcategories) {
      return res.status(400).json({ error: 'Нельзя удалить категорию, имеющую подкатегории' });
    }
    
    // Удаление связей с товарами
    await db('product_categories').where({ category_id: id }).del();
    
    // Удаление категории
    await db('categories').where({ id }).del();
    
    res.json({
      success: true,
      message: 'Категория успешно удалена'
    });
    
  } catch (error) {
    console.error('❌ Ошибка при удалении категории:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении категории',
      error: error.message
    });
  }
});
// ===== Товары =====

// Получение всех товаров с пагинацией и фильтрацией
app.get('/api/products', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'name',
      order = 'asc',
      category,
      search,
      minPrice,
      maxPrice,
      brand,
      featured
    } = req.query;
    
    // Базовый запрос
    let query = db('products')
      .where('is_active', true);
    
    // Фильтрация по категории
    if (category) {
      // Получаем ID категории по slug или используем напрямую, если это ID
      let categoryId;
      
      if (isNaN(category)) {
        // Если это slug
        const categoryObj = await db('categories').where({ slug: category }).first();
        if (categoryObj) {
          categoryId = categoryObj.id;
        }
      } else {
        // Если это ID
        categoryId = category;
      }
      
      if (categoryId) {
        query = query
          .join('product_categories', 'products.id', 'product_categories.product_id')
          .where('product_categories.category_id', categoryId);
      }
    }
    
    // Поиск по названию или описанию
    if (search) {
      query = query.where(function() {
        this.where('products.name', 'ilike', `%${search}%`)
            .orWhere('products.description', 'ilike', `%${search}%`);
      });
    }
    
    // Фильтрация по цене
    if (minPrice) {
      query = query.where('products.price', '>=', minPrice);
    }
    if (maxPrice) {
      query = query.where('products.price', '<=', maxPrice);
    }
    
    // Фильтрация по бренду
    if (brand) {
      query = query.where('products.brand', brand);
    }
    
    // Фильтрация по featured
    if (featured === 'true') {
      query = query.where('products.is_featured', true);
    }
    
    // Подсчет общего количества товаров
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('products.id as count');
    
    // Пагинация и сортировка
    const products = await query
      .select('products.*')
      .orderBy(`products.${sort}`, order)
      .offset((page - 1) * limit)
      .limit(limit);
    
    // Получение категорий для каждого товара
    const productsWithCategories = await Promise.all(products.map(async (product) => {
      const categories = await db('categories')
        .join('product_categories', 'categories.id', 'product_categories.category_id')
        .where('product_categories.product_id', product.id)
        .select('categories.id', 'categories.name', 'categories.slug');
      
      // Получение складских остатков
      const inventory = await db('inventory')
        .where('product_id', product.id)
        .first();
      
      return {
        ...product,
        categories,
        inStock: inventory ? inventory.quantity - inventory.reserved_quantity : 0
      };
    }));
    
    res.json({
      success: true,
      products: productsWithCategories,
      pagination: {
        total: parseInt(count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
    
  } catch (error) {
    console.error('❌ Ошибка при получении товаров:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении товаров',
      error: error.message
    });
  }
});

// Получение товара по ID или slug
app.get('/api/products/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    
    // Поиск товара по ID или slug
    const product = await db('products')
      .where({ id: isNaN(idOrSlug) ? undefined : idOrSlug, slug: isNaN(idOrSlug) ? idOrSlug : undefined })
      .first();
    
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    
    // Получение категорий товара
    const categories = await db('categories')
      .join('product_categories', 'categories.id', 'product_categories.category_id')
      .where('product_categories.product_id', product.id)
      .select('categories.id', 'categories.name', 'categories.slug');
    
    // Получение дополнительных изображений
    const images = await db('product_images')
      .where('product_id', product.id)
      .orderBy('sort_order');
    
    // Получение складских остатков
    const inventory = await db('inventory')
      .where('product_id', product.id)
      .first();
    
    // Получение отзывов
    const reviews = await db('reviews')
      .leftJoin('users', 'reviews.user_id', 'users.id')
      .where('reviews.product_id', product.id)
      .where('reviews.is_approved', true)
      .select(
        'reviews.id',
        'reviews.rating',
        'reviews.comment',
        'reviews.created_at',
        'users.first_name',
        'users.last_name'
      )
      .orderBy('reviews.created_at', 'desc');
    
    // Расчет средней оценки
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;
    
    res.json({
      success: true,
      product: {
        ...product,
        categories,
        images: [{ image_url: product.image_url, sort_order: 0 }, ...images],
        inStock: inventory ? inventory.quantity - inventory.reserved_quantity : 0,
        reviews,
        avgRating
      }
    });
    
  } catch (error) {
    console.error('❌ Ошибка при получении товара:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении товара',
      error: error.message
    });
  }
});

// Создание товара (только для админов и менеджеров)
app.post('/api/products', authenticateToken, checkRole(['admin', 'manager']), [
  body('name').notEmpty().withMessage('Введите название товара'),
  body('slug').notEmpty().withMessage('Введите slug товара'),
  body('price').isNumeric().withMessage('Цена должна быть числом')
], async (req, res) => {
  try {
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      name,
      slug,
      sku,
      description,
      price,
      oldPrice,
      imageUrl,
      isActive,
      isFeatured,
      brand,
      weight,
      dimensions,
      categoryIds,
      quantity
    } = req.body;
    
    // Проверка уникальности slug
    const existingProduct = await db('products').where({ slug }).first();
    if (existingProduct) {
      return res.status(400).json({ error: 'Товар с таким slug уже существует' });
    }
    
    // Транзакция для создания товара и связанных данных
    await db.transaction(async trx => {
      // Создание товара
      const [productId] = await trx('products').insert({
        name,
        slug,
        sku: sku || null,
        description: description || null,
        price,
        old_price: oldPrice || null,
        image_url: imageUrl || null,
        is_active: isActive !== undefined ? isActive : true,
        is_featured: isFeatured !== undefined ? isFeatured : false,
        brand: brand || null,
        weight: weight || null,
        dimensions: dimensions || null
      }).returning('id');
      
      // Связь с категориями
      if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
        const categoryLinks = categoryIds.map(categoryId => ({
          product_id: productId,
          category_id: categoryId
        }));
        
        await trx('product_categories').insert(categoryLinks);
      }
      
      // Создание записи в инвентаре
      await trx('inventory').insert({
        product_id: productId,
        quantity: quantity || 0,
        reserved_quantity: 0,
        warehouse: 'main',
        last_restock_date: trx.fn.now()
      });
    });
    
    res.status(201).json({
      success: true,
      message: 'Товар успешно создан'
    });
    
  } catch (error) {
    console.error('❌ Ошибка при создании товара:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при создании товара',
      error: error.message
    });
  }
});

// Обновление товара (только для админов и менеджеров)
app.put('/api/products/:id', authenticateToken, checkRole(['admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      sku,
      description,
      price,
      oldPrice,
      imageUrl,
      isActive,
      isFeatured,
      brand,
      weight,
      dimensions,
      categoryIds
    } = req.body;
    
    // Проверка существования товара
    const product = await db('products').where({ id }).first();
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    
    // Проверка уникальности slug, если он изменился
    if (slug && slug !== product.slug) {
      const existingProduct = await db('products').where({ slug }).first();
      if (existingProduct) {
        return res.status(400).json({ error: 'Товар с таким slug уже существует' });
      }
    }
    
    // Транзакция для обновления товара и связанных данных
    await db.transaction(async trx => {
      // Обновление товара
      await trx('products')
        .where({ id })
        .update({
          name: name || product.name,
          slug: slug || product.slug,
          sku: sku !== undefined ? sku : product.sku,
          description: description !== undefined ? description : product.description,
          price: price || product.price,
          old_price: oldPrice !== undefined ? oldPrice : product.old_price,
          image_url: imageUrl !== undefined ? imageUrl : product.image_url,
          is_active: isActive !== undefined ? isActive : product.is_active,
          is_featured: isFeatured !== undefined ? isFeatured : product.is_featured,
          brand: brand !== undefined ? brand : product.brand,
          weight: weight !== undefined ? weight : product.weight,
          dimensions: dimensions !== undefined ? dimensions : product.dimensions,
          updated_at: trx.fn.now()
        });
      
      // Обновление связей с категориями, если они предоставлены
      if (categoryIds && Array.isArray(categoryIds)) {
        // Удаление существующих связей
        await trx('product_categories').where({ product_id: id }).del();
        
        // Добавление новых связей
        if (categoryIds.length > 0) {
          const categoryLinks = categoryIds.map(categoryId => ({
            product_id: id,
            category_id: categoryId
          }));
          
          await trx('product_categories').insert(categoryLinks);
        }
      }
    });
    
    res.json({
      success: true,
      message: 'Товар успешно обновлен'
    });
    
  } catch (error) {
    console.error('❌ Ошибка при обновлении товара:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении товара',
      error: error.message
    });
  }
});

// Удаление товара (только для админов)
app.delete('/api/products/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверка существования товара
    const product = await db('products').where({ id }).first();
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    
    // Проверка наличия товара в заказах
    const orderItems = await db('order_items').where({ product_id: id }).first();
    if (orderItems) {
      // Вместо удаления, деактивируем товар
      await db('products')
        .where({ id })
        .update({
          is_active: false,
          updated_at: db.fn.now()
        });
      
      return res.json({
        success: true,
        message: 'Товар деактивирован, так как он используется в заказах'
      });
    }
    
    // Транзакция для удаления товара и связанных данных
    await db.transaction(async trx => {
      // Удаление связей с категориями
      await trx('product_categories').where({ product_id: id }).del();
      
      // Удаление дополнительных изображений
      await trx('product_images').where({ product_id: id }).del();
      
      // Удаление из инвентаря
      await trx('inventory').where({ product_id: id }).del();
      
      // Удаление отзывов
      await trx('reviews').where({ product_id: id }).del();
      
      // Удаление товара
      await trx('products').where({ id }).del();
    });
    
    res.json({
      success: true,
      message: 'Товар успешно удален'
    });
    
  } catch (error) {
    console.error('❌ Ошибка при удалении товара:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении товара',
      error: error.message
    });
  }
});

// Обновление складских остатков (только для админов и менеджеров)
app.put('/api/products/:id/inventory', authenticateToken, checkRole(['admin', 'manager']), [
  body('quantity').isInt({ min: 0 }).withMessage('Количество должно быть неотрицательным числом')
], async (req, res) => {
  try {
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { quantity } = req.body;
    
    // Проверка существования товара
    const product = await db('products').where({ id }).first();
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    
    // Получение текущих складских остатков
    const inventory = await db('inventory').where({ product_id: id }).first();
    
    if (inventory) {
      // Обновление существующей записи
      await db('inventory')
        .where({ product_id: id })
        .update({
          quantity,
          last_restock_date: db.fn.now(),
          updated_at: db.fn.now()
        });
    } else {
      // Создание новой записи
      await db('inventory').insert({
        product_id: id,
        quantity,
        reserved_quantity: 0,
        warehouse: 'main',
        last_restock_date: db.fn.now()
      });
    }
    
    res.json({
      success: true,
      message: 'Складские остатки успешно обновлены'
    });
    
  } catch (error) {
    console.error('❌ Ошибка при обновлении складских остатков:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении складских остатков',
      error: error.message
    });
  }
});

// Добавление отзыва к товару (только для авторизованных пользователей)
app.post('/api/products/:id/reviews', authenticateToken, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Оценка должна быть от 1 до 5'),
  body('comment').optional().notEmpty().withMessage('Комментарий не может быть пустым')
], async (req, res) => {
  try {
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const userId = req.user.id;
    const { rating, comment } = req.body;
    
    // Проверка существования товара
    const product = await db('products').where({ id }).first();
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    
    // Проверка, оставлял ли пользователь уже отзыв на этот товар
    const existingReview = await db('reviews')
      .where({ product_id: id, user_id: userId })
      .first();
    
    if (existingReview) {
      return res.status(400).json({ error: 'Вы уже оставили отзыв на этот товар' });
    }
    
    // Проверка, покупал ли пользователь этот товар (опционально)
    const hasOrdered = await db('order_items')
      .join('orders', 'order_items.order_id', 'orders.id')
      .where('orders.user_id', userId)
      .where('order_items.product_id', id)
      .where('orders.status', 'delivered')
      .first();
    
    // Создание отзыва
    const [reviewId] = await db('reviews').insert({
      product_id: id,
      user_id: userId,
      rating,
      comment: comment || null,
      is_approved: hasOrdered ? true : false // Автоматическое одобрение, если пользователь покупал товар
    }).returning('id');
    
    res.status(201).json({
      success: true,
      message: hasOrdered 
        ? 'Отзыв успешно добавлен' 
        : 'Отзыв отправлен на модерацию',
      reviewId
    });
    
  } catch (error) {
    console.error('❌ Ошибка при добавлении отзыва:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при добавлении отзыва',
      error: error.message
    });
  }
});
// ===== Заказы =====

// Создание заказа
app.post('/api/orders', authenticateToken, [
  body('formData').notEmpty().withMessage('Данные формы не могут быть пустыми'),
  body('cartItems').isArray({ min: 1 }).withMessage('Корзина не может быть пустой'),
  body('total').isNumeric().withMessage('Общая сумма должна быть числом')
], async (req, res) => {
  try {
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { formData, cartItems, total } = req.body;
    const userId = req.user.id;
    
    // Преобразование cartItems для хранимой процедуры
    const orderItems = cartItems.map(item => ({
      product_id: item.id,
      quantity: item.quantity
    }));
    
    // Использование хранимой процедуры для создания заказа
    const result = await db.raw(`
      SELECT create_order(
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?::jsonb
      ) as result
    `, [
      userId,
      formData.address,
      formData.city,
      formData.postalCode,
      formData.country || 'Россия',
      formData.paymentMethod,
      formData.comments || null,
      JSON.stringify(orderItems)
    ]);
    
    const orderResult = result.rows[0].result;
    
    if (!orderResult.success) {
      return res.status(400).json({
        success: false,
        message: orderResult.message,
        insufficient_items: orderResult.insufficient_items
      });
    }
    
    // Генерация даты для письма
    const orderDate = new Date().toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const orderData = {
      formData,
      cartItems,
      total,
      orderNumber: orderResult.order_number,
      orderDate,
    };
    
    // Настройка письма для магазина
    const shopMailOptions = {
      from: `"MotoShop" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_TO,
      subject: `Новый заказ #${orderResult.order_number} на сумму ${formatPrice(total)}`,
      html: generateOrderEmail(orderData),
    };
    
    // Настройка письма для клиента
    const customerMailOptions = {
      from: `"MotoShop" <${process.env.EMAIL_FROM}>`,
      to: formData.email,
      subject: `Ваш заказ #${orderResult.order_number} принят`,
      html: generateOrderEmail(orderData),
    };
    
    // Отправка писем
    try {
      await transporter.sendMail(shopMailOptions);
      console.log(`✅ Письмо о заказе ${orderResult.order_number} отправлено в магазин`);
    } catch (emailError) {
      console.error('❗ Ошибка при отправке письма в магазин:', emailError);
    }
    
    try {
      await transporter.sendMail(customerMailOptions);
      console.log(`✅ Письмо о заказе ${orderResult.order_number} отправлено клиенту`);
    } catch (emailError) {
      console.error('❗ Ошибка при отправке письма клиенту:', emailError);
    }
    
    res.status(200).json({
      success: true,
      message: 'Заказ успешно оформлен',
      orderNumber: orderResult.order_number,
      orderId: orderResult.order_id,
      orderDate
    });
    
  } catch (error) {
    console.error('❌ Ошибка при обработке заказа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при оформлении заказа',
      error: error.message
    });
  }
});

// Получение списка заказов пользователя
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    
    // Получение заказов пользователя
    const orders = await db('orders')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .offset((page - 1) * limit)
      .limit(limit);
    
    // Подсчет общего количества заказов
    const [{ count }] = await db('orders')
      .where({ user_id: userId })
      .count('id as count');
    
    // Получение позиций для каждого заказа
    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const items = await db('order_items')
        .where({ order_id: order.id })
        .select('*');
      
      return {
        ...order,
        items
      };
    }));
    
    res.json({
      success: true,
      orders: ordersWithItems,
      pagination: {
        total: parseInt(count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
    
  } catch (error) {
    console.error('❌ Ошибка при получении заказов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении заказов',
      error: error.message
    });
  }
});

// Получение заказа по ID
app.get('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Получение заказа
    const order = await db('orders')
      .where({ id })
      .first();
    
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }
    
    // Проверка прав доступа
    const isAdmin = req.user.roles.includes('admin');
    const isManager = req.user.roles.includes('manager');
    
    if (order.user_id !== userId && !isAdmin && !isManager) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    
    // Получение позиций заказа
    const items = await db('order_items')
      .leftJoin('products', 'order_items.product_id', 'products.id')
      .where({ order_id: id })
      .select(
        'order_items.*',
        'products.name as product_name',
        'products.image_url',
        'products.slug'
      );
    
    // Получение данных пользователя
    const user = order.user_id ? await db('users')
      .where({ id: order.user_id })
      .select('id', 'email', 'first_name', 'last_name', 'phone')
      .first() : null;
    
    res.json({
      success: true,
      order: {
        ...order,
        items,
        user
      }
    });
    
  } catch (error) {
    console.error('❌ Ошибка при получении заказа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении заказа',
      error: error.message
    });
  }
});

// Обновление статуса заказа (только для админов и менеджеров)
app.put('/api/orders/:id/status', authenticateToken, checkRole(['admin', 'manager']), [
  body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Некорректный статус заказа'),
  body('paymentStatus').optional().isIn(['pending', 'paid', 'failed', 'refunded']).withMessage('Некорректный статус оплаты')
], async (req, res) => {
  try {
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { status, paymentStatus } = req.body;
    
    // Проверка существования заказа
    const order = await db('orders').where({ id }).first();
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Заказ не найден'
      });
    }
    
    // Обновление статуса заказа
    const updateData = {
      status,
      updated_at: db.fn.now()
    };
    
    if (paymentStatus) {
      updateData.payment_status = paymentStatus;
    }
    
    await db('orders')
      .where({ id })
      .update(updateData);
    
    res.json({
      success: true,
      message: 'Статус заказа успешно обновлен',
      oldStatus: order.status,
      newStatus: status
    });
    
  } catch (error) {
    console.error('❌ Ошибка при обновлении статуса заказа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении статуса заказа',
      error: error.message
    });
  }
});

// Получение всех заказов (только для админов и менеджеров)
app.get('/api/admin/orders', authenticateToken, checkRole(['admin', 'manager']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sort = 'created_at',
      order = 'desc',
      search
    } = req.query;
    
    // Базовый запрос
    let query = db('orders');
    
    // Фильтрация по статусу
    if (status) {
      query = query.where('orders.status', status);
    }
    
    // Поиск по номеру заказа или данным пользователя
    if (search) {
      query = query
        .leftJoin('users', 'orders.user_id', 'users.id')
        .where(function() {
          this.where('orders.order_number', 'ilike', `%${search}%`)
              .orWhere('users.email', 'ilike', `%${search}%`)
              .orWhere('users.first_name', 'ilike', `%${search}%`)
              .orWhere('users.last_name', 'ilike', `%${search}%`);
        })
        .select('orders.*');
    }
    
    // Подсчет общего количества заказов
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('orders.id as count');
    
    // Пагинация и сортировка
    const orders = await query
      .orderBy(`orders.${sort}`, order)
      .offset((page - 1) * limit)
      .limit(limit);
    
    // Получение данных пользователей и позиций заказов
    const ordersWithDetails = await Promise.all(orders.map(async (order) => {
      // Данные пользователя
      const user = order.user_id ? await db('users')
        .where({ id: order.user_id })
        .select('id', 'email', 'first_name', 'last_name', 'phone')
        .first() : null;
      
      // Позиции заказа
      const items = await db('order_items')
        .where({ order_id: order.id })
        .select('*');
      
      return {
        ...order,
        user,
        items
      };
    }));
    
    res.json({
      success: true,
      orders: ordersWithDetails,
      pagination: {
        total: parseInt(count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
    
  } catch (error) {
    console.error('❌ Ошибка при получении заказов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении заказов',
      error: error.message
    });
  }
});

// ===== Импорт/Экспорт =====

// Экспорт товаров в CSV (только для админов и менеджеров)
app.get('/api/export/products', authenticateToken, checkRole(['admin', 'manager']), async (req, res) => {
  try {
    // Получение всех товаров
    const products = await db('products')
      .select('*')
      .orderBy('name');
    
    // Получение категорий для каждого товара
    const productsWithCategories = await Promise.all(products.map(async (product) => {
      const categories = await db('categories')
        .join('product_categories', 'categories.id', 'product_categories.category_id')
        .where('product_categories.product_id', product.id)
        .select('categories.name');
      
      const categoryNames = categories.map(cat => cat.name).join(', ');
      
      // Получение складских остатков
      const inventory = await db('inventory')
        .where('product_id', product.id)
        .first();
      
      return {
        ...product,
        categories: categoryNames,
        quantity: inventory ? inventory.quantity : 0,
        reserved_quantity: inventory ? inventory.reserved_quantity : 0
      };
    }));
    
    // Создание временного файла для CSV
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const csvFilePath = path.join(__dirname, 'uploads', `products-${timestamp}.csv`);
    
    // Настройка CSV Writer
    const csvWriter = createObjectCsvWriter({
      path: csvFilePath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'name', title: 'Название' },
        { id: 'slug', title: 'Slug' },
        { id: 'sku', title: 'SKU' },
        { id: 'description', title: 'Описание' },
        { id: 'price', title: 'Цена' },
        { id: 'old_price', title: 'Старая цена' },
        { id: 'image_url', title: 'Изображение' },
        { id: 'is_active', title: 'Активен' },
        { id: 'is_featured', title: 'Рекомендуемый' },
        { id: 'brand', title: 'Бренд' },
        { id: 'weight', title: 'Вес' },
        { id: 'dimensions', title: 'Размеры' },
        { id: 'categories', title: 'Категории' },
        { id: 'quantity', title: 'Количество' },
        { id: 'reserved_quantity', title: 'Зарезервировано' },
        { id: 'created_at', title: 'Дата создания' },
        { id: 'updated_at', title: 'Дата обновления' }
      ]
    });
    
    // Запись данных в CSV
    await csvWriter.writeRecords(productsWithCategories);
    
    // Отправка файла
    res.download(csvFilePath, `products-${timestamp}.csv`, (err) => {
      if (err) {
        console.error('❌ Ошибка при отправке файла:', err);
      }
      
      // Удаление временного файла
      fs.unlink(csvFilePath, (err) => {
        if (err) {
          console.error('❌ Ошибка при удалении временного файла:', err);
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Ошибка при экспорте товаров:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при экспорте товаров',
      error: error.message
    });
  }
});

// Импорт товаров из CSV (только для админов)
app.post('/api/import/products', authenticateToken, checkRole(['admin']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }
    
    const filePath = req.file.path;
    const results = [];
    const errors = [];
    let processed = 0;
    
    // Создание потока для чтения CSV
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', async (data) => {
        try {
          processed++;
          
          // Проверка обязательных полей
          if (!data.name || !data.slug || !data.price) {
            errors.push({
              row: processed,
              message: 'Отсутствуют обязательные поля (name, slug, price)',
              data
            });
            return;
          }
          
          // Проверка уникальности slug
          const existingProduct = await db('products').where({ slug: data.slug }).first();
          
          if (existingProduct) {
            // Обновление существующего товара
            await db('products')
              .where({ id: existingProduct.id })
              .update({
                name: data.name,
                sku: data.sku || null,
                description: data.description || null,
                price: parseFloat(data.price) || existingProduct.price,
                old_price: data.old_price ? parseFloat(data.old_price) : null,
                image_url: data.image_url || existingProduct.image_url,
                is_active: data.is_active === 'true' || data.is_active === '1',
                is_featured: data.is_featured === 'true' || data.is_featured === '1',
                brand: data.brand || null,
                weight: data.weight ? parseFloat(data.weight) : null,
                dimensions: data.dimensions || null,
                updated_at: db.fn.now()
              });
            
            // Обновление складских остатков
            if (data.quantity) {
              await db('inventory')
                .where({ product_id: existingProduct.id })
                .update({
                  quantity: parseInt(data.quantity) || 0,
                  updated_at: db.fn.now()
                });
            }
            
            results.push({
              row: processed,
              action: 'updated',
              id: existingProduct.id,
              name: data.name
            });
          } else {
            // Создание нового товара
            const [productId] = await db('products').insert({
              name: data.name,
              slug: data.slug,
              sku: data.sku || null,
              description: data.description || null,
              price: parseFloat(data.price) || 0,
              old_price: data.old_price ? parseFloat(data.old_price) : null,
              image_url: data.image_url || null,
              is_active: data.is_active === 'true' || data.is_active === '1',
              is_featured: data.is_featured === 'true' || data.is_featured === '1',
              brand: data.brand || null,
              weight: data.weight ? parseFloat(data.weight) : null,
              dimensions: data.dimensions || null
            }).returning('id');
            
            // Создание записи в инвентаре
            await db('inventory').insert({
              product_id: productId,
              quantity: parseInt(data.quantity) || 0,
              reserved_quantity: 0,
              warehouse: 'main',
              last_restock_date: db.fn.now()
            });
            
            results.push({
              row: processed,
              action: 'created',
              id: productId,
              name: data.name
            });
          }
        } catch (error) {
          errors.push({
            row: processed,
            message: error.message,
            data
          });
        }
      })
      .on('end', () => {
        // Удаление временного файла
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error('❌ Ошибка при удалении временного файла:', err);
          }
        });
        
        res.json({
          success: true,
          message: 'Импорт завершен',
          processed,
          results,
          errors
        });
      })
      .on('error', (error) => {
        console.error('❌ Ошибка при чтении CSV:', error);
        res.status(500).json({
          success: false,
          message: 'Ошибка при чтении CSV',
          error: error.message
        });
      });
    
  } catch (error) {
    console.error('❌ Ошибка при импорте товаров:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при импорте товаров',
      error: error.message
    });
  }
});
// ===== Аналитика =====

// Получение статистики продаж (только для админов и менеджеров)
app.get('/api/analytics/sales', authenticateToken, checkRole(['admin', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Использование хранимой функции для получения статистики продаж
    const result = await db.raw(`
      SELECT get_sales_statistics(?, ?) as result
    `, [start, end]);
    
    const statistics = result.rows[0].result;
    
    res.json({
      success: true,
      statistics
    });
    
  } catch (error) {
    console.error('❌ Ошибка при получении статистики продаж:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статистики продаж',
      error: error.message
    });
  }
});

// Получение статистики по категориям (только для админов и менеджеров)
app.get('/api/analytics/categories', authenticateToken, checkRole(['admin', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Получение статистики по категориям
    const categoryStats = await db('order_items')
      .join('products', 'order_items.product_id', 'products.id')
      .join('product_categories', 'products.id', 'product_categories.product_id')
      .join('categories', 'product_categories.category_id', 'categories.id')
      .join('orders', 'order_items.order_id', 'orders.id')
      .select('categories.id', 'categories.name', 'categories.slug')
      .sum('order_items.quantity as total_quantity')
      .sum(db.raw('order_items.quantity * order_items.price as total_revenue'))
      .where('orders.status', '!=', 'cancelled')
      .whereBetween('orders.created_at', [start, end])
      .groupBy('categories.id', 'categories.name', 'categories.slug')
      .orderBy('total_revenue', 'desc');
    
    res.json({
      success: true,
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      categories: categoryStats
    });
    
  } catch (error) {
    console.error('❌ Ошибка при получении статистики по категориям:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статистики по категориям',
      error: error.message
    });
  }
});

// Получение статистики по пользователям (только для админов)
app.get('/api/analytics/users', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    // Общая статистика пользователей
    const userStats = await db('users')
      .select(db.raw('COUNT(*) as total_users'))
      .select(db.raw('COUNT(CASE WHEN is_active = true THEN 1 END) as active_users'))
      .first();
    
    // Статистика регистраций по месяцам
    const registrationStats = await db.raw(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as count
      FROM users
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
      LIMIT 12
    `);
    
    // Топ покупателей
    const topCustomers = await db('orders')
      .join('users', 'orders.user_id', 'users.id')
      .select(
        'users.id',
        'users.email',
        'users.first_name',
        'users.last_name'
      )
      .count('orders.id as order_count')
      .sum('orders.total_amount as total_spent')
      .where('orders.status', '!=', 'cancelled')
      .groupBy('users.id', 'users.email', 'users.first_name', 'users.last_name')
      .orderBy('total_spent', 'desc')
      .limit(10);
    
    res.json({
      success: true,
      statistics: {
        users: userStats,
        registrations: registrationStats.rows,
        topCustomers
      }
    });
    
  } catch (error) {
    console.error('❌ Ошибка при получении статистики по пользователям:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статистики по пользователям',
      error: error.message
    });
  }
});

// Экспорт статистики продаж в CSV (только для админов и менеджеров)
app.get('/api/analytics/export/sales', authenticateToken, checkRole(['admin', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Получение данных о продажах
    const salesData = await db('orders')
      .select(
        'orders.id',
        'orders.order_number',
        'orders.created_at',
        'orders.total_amount',
        'orders.status',
        'orders.payment_method',
        'orders.payment_status',
        db.raw('CONCAT(users.first_name, \' \', users.last_name) as customer_name'),
        'users.email'
      )
      .leftJoin('users', 'orders.user_id', 'users.id')
      .whereBetween('orders.created_at', [start, end])
      .orderBy('orders.created_at', 'desc');
    
    // Создание временного файла для CSV
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const csvFilePath = path.join(__dirname, 'uploads', `sales-${timestamp}.csv`);
    
    // Настройка CSV Writer
    const csvWriter = createObjectCsvWriter({
      path: csvFilePath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'order_number', title: 'Номер заказа' },
        { id: 'created_at', title: 'Дата' },
        { id: 'total_amount', title: 'Сумма' },
        { id: 'status', title: 'Статус' },
        { id: 'payment_method', title: 'Метод оплаты' },
        { id: 'payment_status', title: 'Статус оплаты' },
        { id: 'customer_name', title: 'Покупатель' },
        { id: 'email', title: 'Email' }
      ]
    });
    
    // Запись данных в CSV
    await csvWriter.writeRecords(salesData);
    
    // Отправка файла
    res.download(csvFilePath, `sales-${timestamp}.csv`, (err) => {
      if (err) {
        console.error('❌ Ошибка при отправке файла:', err);
      }
      
      // Удаление временного файла
      fs.unlink(csvFilePath, (err) => {
        if (err) {
          console.error('❌ Ошибка при удалении временного файла:', err);
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Ошибка при экспорте статистики продаж:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при экспорте статистики продаж',
      error: error.message
    });
  }
});

// ===== Аудит =====

// Получение журнала аудита (только для админов)
app.get('/api/audit', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'desc',
      table,
      action,
      userId
    } = req.query;
    
    // Базовый запрос
    let query = db('audit_log');
    
    // Фильтрация по таблице
    if (table) {
      query = query.where('table_name', table);
    }
    
    // Фильтрация по действию
    if (action) {
      query = query.where('action', action);
    }
    
    // Фильтрация по пользователю
    if (userId) {
      query = query.where('user_id', userId);
    }
    
    // Подсчет общего количества записей
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('id as count');
    
    // Пагинация и сортировка
    const logs = await query
      .leftJoin('users', 'audit_log.user_id', 'users.id')
      .select(
        'audit_log.*',
        'users.email',
        'users.first_name',
        'users.last_name'
      )
      .orderBy(`audit_log.${sort}`, order)
      .offset((page - 1) * limit)
      .limit(limit);
    
    res.json({
      success: true,
      logs,
      pagination: {
        total: parseInt(count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
    
  } catch (error) {
    console.error('❌ Ошибка при получении журнала аудита:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении журнала аудита',
      error: error.message
    });
  }
});

// Получение всех ролей
app.get('/api/roles', authenticateToken, async (req, res) => {
  try {
    const roles = await db('roles')
      .select('id', 'name', 'description')
      .orderBy('name');
    
    res.json({
      success: true,
      roles
    });
  } catch (error) {
    console.error('❌ Ошибка при получении ролей:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении ролей',
      error: error.message
    });
  }
});

// ===== Маршруты админ-панели =====

// Подключение маршрутов админ-панели
app.use('/api/admin', adminRoutes);

// Подключение маршрутов загрузки файлов
app.use('/api/upload', uploadRoutes);

// ===== Системные маршруты =====

// Корневой маршрут API
app.get('/api', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'MotoShop API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/*',
      categories: '/api/categories',
      products: '/api/products',
      orders: '/api/orders',
      admin: '/api/admin/*',
      analytics: '/api/analytics/*'
    }
  });
});

// Проверка здоровья сервера
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Обработка 404 для API маршрутов
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Запуск сервера
const startServer = async () => {
  try {
    // Проверка подключения к базе данных
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Не удалось подключиться к базе данных. Сервер не будет запущен.');
      process.exit(1);
    }
    
    app.listen(PORT, () => {
      console.log(`\n🚀 Сервер запущен на порту ${PORT}`);
      console.log(`📧 Email сервис настроен: ${process.env.SMTP_USER}`);
      console.log(`🌐 API доступен по адресу: http://localhost:${PORT}/api`);
      console.log(`🛢️ База данных: ${process.env.DB_NAME} на ${process.env.DB_HOST}`);
    });
  } catch (error) {
    console.error('❌ Ошибка при запуске сервера:', error);
    process.exit(1);
  }
};

startServer();
