import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3003;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID', 'X-User-Role'],
  exposedHeaders: ['Content-Disposition']
}));
app.use(express.json());

// Добавляем мидлвар для логирования запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.url}`);
  
  // Проверяем заголовки авторизации
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  
  if (userId && userRole) {
    console.log(`Запрос от пользователя ID: ${userId}, роли: ${userRole}`);
  }
  
  next();
});

// Фиксированные пользователи
const users = [
  {
    id: 1,
    email: 'admin@motoshop.ru',
    password: 'admin123',
    first_name: 'Админ',
    last_name: 'Системы',
    roles: ['admin'],
    settings: {
      theme: 'dark',
      date_format: 'DD.MM.YYYY',
      items_per_page: 20,
      preferred_language: 'ru',
      notification_enabled: true
    }
  },
  {
    id: 2,
    email: 'manager@motoshop.ru',
    password: 'manager123',
    first_name: 'Менеджер',
    last_name: 'Магазина',
    roles: ['manager'],
    settings: {
      theme: 'light',
      date_format: 'DD.MM.YYYY',
      items_per_page: 15,
      preferred_language: 'ru',
      notification_enabled: true
    }
  },
  {
    id: 3,
    email: 'user@example.com',
    password: 'user123',
    first_name: 'Иван',
    last_name: 'Петров',
    roles: ['customer'],
    settings: {
      theme: 'light',
      date_format: 'DD.MM.YYYY',
      items_per_page: 10,
      preferred_language: 'ru',
      notification_enabled: true
    }
  }
];

// Вход в систему
app.post('/api/auth/login', (req, res) => {
  try {
    console.log('✅ Получен запрос на вход в систему:', req.body);
    
    const { email, password } = req.body;
    console.log('✅ Получены данные:', { email, password });
    
    // Поиск пользователя по email и паролю
    const user = users.find(u => u.email === email && u.password === password);
    console.log('✅ Результат поиска пользователя:', user ? 'Найден' : 'Не найден');
    
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    // Отправка успешного ответа
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roles: user.roles,
        settings: user.settings
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
app.post('/api/auth/register', (req, res) => {
  try {
    console.log('✅ Получен запрос на регистрацию:', req.body);
    
    const { email, password, firstName, lastName, phone } = req.body;
    
    // Проверка, существует ли пользователь с таким email
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }
    
    // Создание нового пользователя
    const newUser = {
      id: users.length + 1,
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      roles: ['customer'],
      settings: {
        theme: 'light',
        date_format: 'DD.MM.YYYY',
        items_per_page: 10,
        preferred_language: 'ru',
        notification_enabled: true
      }
    };
    
    // Добавление пользователя в массив
    users.push(newUser);
    
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
app.get('/api/auth/profile', (req, res) => {
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

// Корневой маршрут сайта
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Корневой маршрут API
app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Проверка здоровья сервера
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Оформление заказа
app.post('/api/orders', (req, res) => {
  try {
    console.log('✅ Получен запрос на оформление заказа');
    
    const { formData, cartItems, total } = req.body;
    
    // Проверка наличия необходимых данных
    if (!formData || !cartItems || !total) {
      console.error('❌ Отсутствуют необходимые данные для заказа');
      return res.status(400).json({
        success: false,
        message: 'Отсутствуют необходимые данные для заказа'
      });
    }
    
    // Генерация номера заказа
    const orderNumber = 'ORD-' + Date.now().toString().slice(-6);
    
    // Генерация даты заказа
    const orderDate = new Date().toLocaleString('ru-RU');
    
    // Симуляция успешного заказа
    res.json({
      success: true,
      message: 'Заказ успешно оформлен',
      orderNumber,
      orderDate,
      orderId: Date.now()
    });
    
    console.log('✅ Заказ успешно оформлен:', { orderNumber, orderDate });
    console.log('✅ Данные заказа:', {
      ФИО: `${formData.firstName} ${formData.lastName}`,
      Email: formData.email,
      Телефон: formData.phone,
      Адрес: `${formData.address}, ${formData.city}, ${formData.postalCode}`,
      Способ_оплаты: formData.paymentMethod,
      Сумма: total,
      Количество_товаров: cartItems.length
    });
  } catch (error) {
    console.error('❌ Ошибка при оформлении заказа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при оформлении заказа',
      error: error.message
    });
  }
});

// Маршруты для админ-панели
app.get('/api/admin/orders', (req, res) => {
  try {
    console.log('✅ Получен запрос на получение заказов для админа');
    
    // Проверяем права доступа
    const userRole = req.headers['x-user-role'];
    if (userRole && (userRole.includes('admin') || userRole.includes('manager'))) {
      console.log('✅ Пользователь имеет права доступа к админ-панели');
    } else {
      console.log('❌ Пользователь не имеет прав доступа к админ-панели');
      // Но все равно отдаем данные для тестирования
    }
    
    // Симуляция списка заказов для админа
    const orders = [
      {
        id: 1,
        order_number: 'ORD-123456',
        user_id: 3,
        user_email: 'user@example.com',
        user_name: 'Иван Петров',
        status: 'completed',
        payment_status: 'paid',
        total_amount: 1250000,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        order_number: 'ORD-123457',
        user_id: 3,
        user_email: 'user@example.com',
        user_name: 'Иван Петров',
        status: 'processing',
        payment_status: 'paid',
        total_amount: 45000,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        order_number: 'ORD-123458',
        user_id: 3,
        user_email: 'user@example.com',
        user_name: 'Иван Петров',
        status: 'pending',
        payment_status: 'pending',
        total_amount: 12000,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    res.json({
      success: true,
      orders,
      pagination: {
        total: 3,
        page: 1,
        limit: 10,
        pages: 1
      }
    });
    
    console.log('✅ Заказы успешно отправлены');
  } catch (error) {
    console.error('❌ Ошибка при получении заказов для админа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении заказов'
    });
  }
});

// Маршрут для дашборда админа
app.get('/api/admin/dashboard', (req, res) => {
  try {
    console.log('✅ Получен запрос на получение данных дашборда');
    
    // Симуляция данных дашборда
    const dashboardData = {
      orders: {
        total: 156,
        pending: 12,
        processing: 8,
        completed: 136
      },
      revenue: {
        total: 12500000,
        thisMonth: 2800000,
        lastMonth: 2500000,
        growth: 12 // процент роста
      },
      users: {
        total: 120,
        newThisMonth: 15
      },
      products: {
        total: 45,
        outOfStock: 3
      }
    };
    
    res.json({
      success: true,
      data: dashboardData
    });
    
    console.log('✅ Данные дашборда успешно отправлены');
  } catch (error) {
    console.error('❌ Ошибка при получении данных дашборда:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении данных дашборда'
    });
  }
});

app.get('/api/admin/users', (req, res) => {
  try {
    // Симуляция списка пользователей для админа
    const users = [
      {
        id: 1,
        email: 'admin@motoshop.ru',
        first_name: 'Админ',
        last_name: 'Системы',
        phone: '+7 (999) 123-45-67',
        is_active: true,
        roles: ['admin'],
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        email: 'manager@motoshop.ru',
        first_name: 'Менеджер',
        last_name: 'Магазина',
        phone: '+7 (999) 765-43-21',
        is_active: true,
        roles: ['manager'],
        created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        email: 'user@example.com',
        first_name: 'Иван',
        last_name: 'Петров',
        phone: '+7 (999) 555-55-55',
        is_active: true,
        roles: ['customer'],
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    res.json({
      success: true,
      users,
      pagination: {
        total: 3,
        page: 1,
        limit: 10,
        pages: 1
      }
    });
  } catch (error) {
    console.error('❌ Ошибка при получении пользователей для админа:', error);
    res.status(500).json({
      error: 'Ошибка при получении пользователей'
    });
  }
});

// Получение списка заказов
app.get('/api/orders', (req, res) => {
  try {
    // Симуляция списка заказов
    const orders = [
      {
        id: 1,
        order_number: 'ORD-123456',
        status: 'completed',
        total_amount: 1250000,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        order_number: 'ORD-123457',
        status: 'processing',
        total_amount: 45000,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        order_number: 'ORD-123458',
        status: 'pending',
        total_amount: 12000,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    res.json({
      success: true,
      orders,
      pagination: {
        total: 3,
        page: 1,
        limit: 10,
        pages: 1
      }
    });
  } catch (error) {
    console.error('❌ Ошибка при получении заказов:', error);
    res.status(500).json({
      error: 'Ошибка при получении заказов'
    });
  }
});

// Маршруты для аналитики
app.get('/api/analytics/sales', (req, res) => {
  try {
    console.log('✅ Получен запрос на получение статистики продаж');
    
    // Симуляция статистики продаж
    const salesStats = [
      {
        period: '2025-10-21',
        total_orders: 5,
        total_revenue: 1500000,
        average_order_value: 300000,
        unique_customers: 3
      },
      {
        period: '2025-10-22',
        total_orders: 3,
        total_revenue: 900000,
        average_order_value: 300000,
        unique_customers: 2
      },
      {
        period: '2025-10-23',
        total_orders: 7,
        total_revenue: 2100000,
        average_order_value: 300000,
        unique_customers: 5
      },
      {
        period: '2025-10-24',
        total_orders: 4,
        total_revenue: 1200000,
        average_order_value: 300000,
        unique_customers: 4
      },
      {
        period: '2025-10-25',
        total_orders: 6,
        total_revenue: 1800000,
        average_order_value: 300000,
        unique_customers: 6
      },
      {
        period: '2025-10-26',
        total_orders: 8,
        total_revenue: 2400000,
        average_order_value: 300000,
        unique_customers: 7
      },
      {
        period: '2025-10-27',
        total_orders: 10,
        total_revenue: 3000000,
        average_order_value: 300000,
        unique_customers: 8
      }
    ];
    
    // Симуляция топовых товаров
    const topProducts = [
      {
        id: 1,
        name: 'Yamaha YZF-R1',
        image_url: '/images/products/yamaha-r1.jpg',
        total_quantity: 5,
        total_revenue: 6250000
      },
      {
        id: 3,
        name: 'BMW R 1250 GS Adventure',
        image_url: '/images/products/bmw-gs.jpg',
        total_quantity: 3,
        total_revenue: 4950000
      },
      {
        id: 2,
        name: 'Harley-Davidson Road King',
        image_url: '/images/products/harley-road-king.jpg',
        total_quantity: 2,
        total_revenue: 3600000
      },
      {
        id: 4,
        name: 'Шлем AGV K6',
        image_url: '/images/products/agv-k6.jpg',
        total_quantity: 8,
        total_revenue: 360000
      },
      {
        id: 5,
        name: 'Куртка Dainese Super Speed 3',
        image_url: '/images/products/dainese-jacket.jpg',
        total_quantity: 6,
        total_revenue: 312000
      }
    ];
    
    // Суммарная статистика
    const sales = {
      total_orders: 43,
      total_revenue: 12900000,
      avg_order_value: 300000
    };
    
    res.json({
      success: true,
      period: {
        start: req.query.startDate || '2025-10-21',
        end: req.query.endDate || '2025-10-27'
      },
      sales,
      statistics: salesStats,
      top_products: topProducts
    });
    
    console.log('✅ Статистика продаж успешно отправлена');
  } catch (error) {
    console.error('❌ Ошибка при получении статистики продаж:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статистики продаж'
    });
  }
});

app.get('/api/analytics/categories', (req, res) => {
  try {
    console.log('✅ Получен запрос на получение статистики по категориям');
    
    // Симуляция статистики по категориям
    const categoriesStats = [
      {
        id: 1,
        name: 'Мотоциклы',
        slug: 'motorcycles',
        total_quantity: 10,
        total_revenue: 14800000
      },
      {
        id: 2,
        name: 'Экипировка',
        slug: 'gear',
        total_quantity: 15,
        total_revenue: 672000
      },
      {
        id: 3,
        name: 'Запчасти',
        slug: 'parts',
        total_quantity: 20,
        total_revenue: 800000
      },
      {
        id: 4,
        name: 'Аксессуары',
        slug: 'accessories',
        total_quantity: 12,
        total_revenue: 628000
      }
    ];
    
    res.json({
      success: true,
      period: {
        start: req.query.startDate || '2025-10-21',
        end: req.query.endDate || '2025-10-27'
      },
      categories: categoriesStats
    });
    
    console.log('✅ Статистика по категориям успешно отправлена');
  } catch (error) {
    console.error('❌ Ошибка при получении статистики по категориям:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статистики по категориям'
    });
  }
});

// Маршрут для получения статистики по топовым товарам
app.get('/api/analytics/top-products', (req, res) => {
  try {
    console.log('✅ Получен запрос на получение топовых товаров');
    
    // Симуляция топовых товаров
    const topProducts = [
      {
        id: 1,
        name: 'Yamaha YZF-R1',
        image_url: '/images/products/yamaha-r1.jpg',
        total_quantity: 5,
        total_revenue: 6250000
      },
      {
        id: 3,
        name: 'BMW R 1250 GS Adventure',
        image_url: '/images/products/bmw-gs.jpg',
        total_quantity: 3,
        total_revenue: 4950000
      },
      {
        id: 2,
        name: 'Harley-Davidson Road King',
        image_url: '/images/products/harley-road-king.jpg',
        total_quantity: 2,
        total_revenue: 3600000
      },
      {
        id: 4,
        name: 'Шлем AGV K6',
        image_url: '/images/products/agv-k6.jpg',
        total_quantity: 8,
        total_revenue: 360000
      },
      {
        id: 5,
        name: 'Куртка Dainese Super Speed 3',
        image_url: '/images/products/dainese-jacket.jpg',
        total_quantity: 6,
        total_revenue: 312000
      }
    ];
    
    res.json({
      success: true,
      period: {
        start: req.query.startDate || '2025-10-21',
        end: req.query.endDate || '2025-10-27'
      },
      products: topProducts
    });
    
    console.log('✅ Топовые товары успешно отправлены');
  } catch (error) {
    console.error('❌ Ошибка при получении топовых товаров:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении топовых товаров'
    });
  }
});

app.get('/api/analytics/users', (req, res) => {
  try {
    // Симуляция статистики по пользователям
    const usersStats = {
      total_users: 100,
      new_users_last_month: 15,
      active_users: 75,
      user_growth: [
        { month: '2025-05', count: 60 },
        { month: '2025-06', count: 65 },
        { month: '2025-07', count: 72 },
        { month: '2025-08', count: 80 },
        { month: '2025-09', count: 90 },
        { month: '2025-10', count: 100 }
      ]
    };
    
    res.json({
      success: true,
      statistics: usersStats
    });
  } catch (error) {
    console.error('❌ Ошибка при получении статистики по пользователям:', error);
    res.status(500).json({
      error: 'Ошибка при получении статистики по пользователям'
    });
  }
});

// Экспорт статистики продаж в CSV
app.get('/api/analytics/export/sales', (req, res) => {
  try {
    console.log('✅ Получен запрос на экспорт статистики продаж в CSV');
    
    // Симуляция данных для CSV
    const salesData = [
      ['Period', 'Total Orders', 'Total Revenue', 'Average Order Value', 'Unique Customers'],
      ['2025-10-21', '5', '1500000', '300000', '3'],
      ['2025-10-22', '3', '900000', '300000', '2'],
      ['2025-10-23', '7', '2100000', '300000', '5'],
      ['2025-10-24', '4', '1200000', '300000', '4'],
      ['2025-10-25', '6', '1800000', '300000', '6'],
      ['2025-10-26', '8', '2400000', '300000', '7'],
      ['2025-10-27', '10', '3000000', '300000', '8']
    ];
    
    // Создание CSV-строки
    const csvContent = salesData.map(row => row.join(',')).join('\n');
    
    // Отправка CSV-файла
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_statistics.csv');
    res.send(csvContent);
    
    console.log('✅ Статистика продаж успешно экспортирована в CSV');
  } catch (error) {
    console.error('❌ Ошибка при экспорте статистики продаж в CSV:', error);
    res.status(500).json({
      error: 'Ошибка при экспорте статистики продаж в CSV'
    });
  }
});

// Экспорт списка продуктов в CSV
app.get('/api/analytics/export/products', (req, res) => {
  try {
    console.log('✅ Получен запрос на экспорт списка продуктов в CSV');
    
    // Симуляция данных для CSV
    const productsData = [
      ['ID', 'Name', 'SKU', 'Price', 'Category', 'Brand', 'In Stock'],
      ['1', 'Yamaha YZF-R1', 'MOTO-001', '1250000', 'Motorcycles', 'Yamaha', '5'],
      ['2', 'Harley-Davidson Road King', 'MOTO-002', '1800000', 'Motorcycles', 'Harley-Davidson', '3'],
      ['3', 'BMW R 1250 GS Adventure', 'MOTO-003', '1650000', 'Motorcycles', 'BMW', '2'],
      ['4', 'Шлем AGV K6', 'GEAR-001', '45000', 'Gear', 'AGV', '10'],
      ['5', 'Куртка Dainese Super Speed 3', 'GEAR-002', '52000', 'Gear', 'Dainese', '8'],
      ['6', 'Перчатки Alpinestars GP Pro R3', 'GEAR-003', '12000', 'Gear', 'Alpinestars', '15']
    ];
    
    // Создание CSV-строки
    const csvContent = productsData.map(row => row.join(',')).join('\n');
    
    // Отправка CSV-файла
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products_list.csv');
    res.send(csvContent);
    
    console.log('✅ Список продуктов успешно экспортирован в CSV');
  } catch (error) {
    console.error('❌ Ошибка при экспорте списка продуктов в CSV:', error);
    res.status(500).json({
      error: 'Ошибка при экспорте списка продуктов в CSV'
    });
  }
});

// Экспорт списка заказов в CSV
app.get('/api/analytics/export/orders', (req, res) => {
  try {
    console.log('✅ Получен запрос на экспорт списка заказов в CSV');
    
    // Симуляция данных для CSV
    const ordersData = [
      ['Order Number', 'Date', 'Customer', 'Status', 'Payment Status', 'Total'],
      ['ORD-123456', '2025-10-21', 'user@example.com', 'completed', 'paid', '1250000'],
      ['ORD-123457', '2025-10-25', 'user@example.com', 'processing', 'paid', '45000'],
      ['ORD-123458', '2025-10-27', 'user@example.com', 'pending', 'pending', '12000']
    ];
    
    // Создание CSV-строки
    const csvContent = ordersData.map(row => row.join(',')).join('\n');
    
    // Отправка CSV-файла
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders_list.csv');
    res.send(csvContent);
    
    console.log('✅ Список заказов успешно экспортирован в CSV');
  } catch (error) {
    console.error('❌ Ошибка при экспорте списка заказов в CSV:', error);
    res.status(500).json({
      error: 'Ошибка при экспорте списка заказов в CSV'
    });
  }
});

// Добавляем маршрут для получения графика продаж
app.get('/api/analytics/sales-chart', (req, res) => {
  try {
    // Здесь можно было бы генерировать реальный график,
    // но для простоты мы вернем заглушку
    res.redirect('https://via.placeholder.com/800x400?text=График+продаж');
  } catch (error) {
    console.error('❌ Ошибка при генерации графика продаж:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при генерации графика продаж'
    });
  }
});

// Экспорт статистики в PDF
app.get('/api/analytics/export/pdf', (req, res) => {
  try {
    console.log('✅ Получен запрос на экспорт статистики в PDF');
    
    // В реальном приложении здесь была бы генерация PDF
    // Для простоты мы просто перенаправим на заглушку
    
    // Устанавливаем заголовки для скачивания PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_report.pdf');
    
    // Перенаправляем на заглушку PDF
    res.redirect('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
    
    console.log('✅ Статистика успешно экспортирована в PDF');
  } catch (error) {
    console.error('❌ Ошибка при экспорте статистики в PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при экспорте статистики в PDF'
    });
  }
});

// Экспорт дашборда в PDF
app.get('/api/admin/dashboard/export/pdf', (req, res) => {
  try {
    console.log('✅ Получен запрос на экспорт дашборда в PDF');
    
    // Устанавливаем заголовки для скачивания PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=dashboard_report.pdf');
    
    // Перенаправляем на заглушку PDF
    res.redirect('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
    
    console.log('✅ Дашборд успешно экспортирован в PDF');
  } catch (error) {
    console.error('❌ Ошибка при экспорте дашборда в PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при экспорте дашборда в PDF'
    });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`\n🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🌐 API доступен по адресу: http://localhost:${PORT}/api`);
});
