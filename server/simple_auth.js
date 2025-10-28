import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import db from './db/index.js';

const app = express();
const PORT = 3003;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());

// Проверка подключения к базе данных
async function testConnection() {
  try {
    await db.raw('SELECT 1');
    console.log('✅ Подключение к базе данных установлено');
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:', error);
    return false;
  }
}

// Вход в систему
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('✅ Получен запрос на вход в систему:', req.body);
    
    const { email, password } = req.body;
    console.log('✅ Получены данные:', { email });
    
    // Поиск пользователя по email
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
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    console.log('✅ Результат проверки пароля:', passwordMatch ? 'Совпадает' : 'Не совпадает');
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    // Получение ролей пользователя
    const userRoles = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', user.id)
      .select('roles.name');
    
    const roles = userRoles.map(role => role.name);
    console.log('✅ Роли пользователя:', roles);
    
    // Получение настроек пользователя
    const settings = await db('user_settings').where({ user_id: user.id }).first();
    console.log('✅ Настройки пользователя:', settings ? 'Найдены' : 'Не найдены');
    
    // Отправка успешного ответа
    res.json({
      success: true,
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
  } catch (error) {
    console.error('❌ Ошибка при входе в систему:', error);
    res.status(500).json({
      error: 'Ошибка при входе в систему'
    });
  }
});

// Регистрация нового пользователя
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('✅ Получен запрос на регистрацию:', req.body);
    
    const { email, password, firstName, lastName, phone } = req.body;
    
    // Проверка, существует ли пользователь с таким email
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }
    
    // Хеширование пароля
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Транзакция для создания пользователя и назначения роли
    await db.transaction(async trx => {
      // Создание пользователя
      const [userId] = await trx('users').insert({
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        is_active: true
      }).returning('id');
      
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
      error: 'Ошибка при регистрации пользователя'
    });
  }
});

// Получение профиля пользователя
app.get('/api/auth/profile', async (req, res) => {
  try {
    // В простой версии просто возвращаем успех
    res.json({
      success: true,
      message: 'Профиль получен'
    });
  } catch (error) {
    console.error('❌ Ошибка при получении профиля:', error);
    res.status(500).json({
      error: 'Ошибка при получении профиля'
    });
  }
});

// Получение категорий
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
      error: 'Ошибка при получении категорий'
    });
  }
});

// Получение категории по slug
app.get('/api/categories/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const category = await db('categories')
      .where({ slug })
      .first();
    
    if (!category) {
      return res.status(404).json({
        error: 'Категория не найдена'
      });
    }
    
    const subcategories = await db('categories')
      .where({ parent_id: category.id, is_active: true })
      .orderBy('name');
    
    res.json({
      success: true,
      category,
      subcategories
    });
  } catch (error) {
    console.error('❌ Ошибка при получении категории:', error);
    res.status(500).json({
      error: 'Ошибка при получении категории'
    });
  }
});

// Получение товаров
app.get('/api/products', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search
    } = req.query;
    
    let query = db('products')
      .where('is_active', true);
    
    // Фильтрация по категории
    if (category) {
      const categoryObj = await db('categories').where({ slug: category }).first();
      if (categoryObj) {
        query = query
          .join('product_categories', 'products.id', 'product_categories.product_id')
          .where('product_categories.category_id', categoryObj.id);
      }
    }
    
    // Поиск по названию или описанию
    if (search) {
      query = query.where(function() {
        this.where('products.name', 'ilike', `%${search}%`)
            .orWhere('products.description', 'ilike', `%${search}%`);
      });
    }
    
    // Подсчет общего количества товаров
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('products.id as count');
    
    // Получение товаров с пагинацией
    const products = await query
      .select('products.*')
      .orderBy('products.name')
      .offset((page - 1) * limit)
      .limit(limit);
    
    res.json({
      success: true,
      products,
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
      error: 'Ошибка при получении товаров'
    });
  }
});

// Проверка здоровья сервера
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Запуск сервера
async function startServer() {
  try {
    // Проверка подключения к базе данных
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Не удалось подключиться к базе данных. Сервер не будет запущен.');
      process.exit(1);
    }
    
    app.listen(PORT, () => {
      console.log(`\n🚀 Сервер запущен на порту ${PORT}`);
      console.log(`🌐 API доступен по адресу: http://localhost:${PORT}/api`);
      console.log(`🛢️ База данных: ${process.env.DB_NAME || 'motoshop'} на ${process.env.DB_HOST || 'localhost'}`);
    });
  } catch (error) {
    console.error('❌ Ошибка при запуске сервера:', error);
    process.exit(1);
  }
}

startServer();
