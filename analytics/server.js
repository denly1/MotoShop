import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import knex from 'knex';
import jwt from 'jsonwebtoken';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Настройка подключения к БД
const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'motoshop'
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Middleware для проверки JWT токена
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
    next();
  });
};

// Middleware для проверки роли администратора
const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.roles.includes('admin')) {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }
  next();
};

// Генерация графика продаж
const generateSalesChart = async (startDate, endDate) => {
  const width = 800;
  const height = 400;
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });
  
  // Получение данных о продажах
  const salesData = await db('orders')
    .select(db.raw('DATE_TRUNC(\'day\', created_at) as date'))
    .sum('total_amount as total')
    .where('status', '!=', 'cancelled')
    .whereBetween('created_at', [startDate, endDate])
    .groupBy('date')
    .orderBy('date');
  
  const labels = salesData.map(item => {
    const date = new Date(item.date);
    return date.toLocaleDateString('ru-RU');
  });
  
  const data = salesData.map(item => parseFloat(item.total));
  
  const configuration = {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Продажи (руб)',
        data,
        backgroundColor: 'rgba(29, 53, 87, 0.2)',
        borderColor: 'rgba(29, 53, 87, 1)',
        borderWidth: 2,
        tension: 0.4
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `${value.toLocaleString('ru-RU')} ₽`
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Динамика продаж',
          font: {
            size: 18
          }
        },
        legend: {
          position: 'bottom'
        }
      }
    }
  };
  
  return await chartJSNodeCanvas.renderToBuffer(configuration);
};

// API endpoints

// Получение статистики продаж
app.get('/api/analytics/sales', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const salesStats = await db('orders')
      .select(db.raw('COUNT(*) as total_orders'))
      .sum('total_amount as total_revenue')
      .avg('total_amount as avg_order_value')
      .where('status', '!=', 'cancelled')
      .whereBetween('created_at', [start, end])
      .first();
    
    const topProducts = await db('order_items')
      .join('products', 'order_items.product_id', 'products.id')
      .join('orders', 'order_items.order_id', 'orders.id')
      .select('products.id', 'products.name', 'products.image_url')
      .sum('order_items.quantity as total_quantity')
      .sum(db.raw('order_items.quantity * order_items.price as total_revenue'))
      .where('orders.status', '!=', 'cancelled')
      .whereBetween('orders.created_at', [start, end])
      .groupBy('products.id', 'products.name', 'products.image_url')
      .orderBy('total_quantity', 'desc')
      .limit(5);
    
    res.json({
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      sales: {
        total_orders: parseInt(salesStats.total_orders),
        total_revenue: parseFloat(salesStats.total_revenue) || 0,
        avg_order_value: parseFloat(salesStats.avg_order_value) || 0
      },
      top_products: topProducts
    });
  } catch (error) {
    console.error('Ошибка при получении статистики продаж:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении статистики' });
  }
});

// Получение графика продаж
app.get('/api/analytics/sales-chart', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const chartBuffer = await generateSalesChart(start, end);
    
    res.set('Content-Type', 'image/png');
    res.send(chartBuffer);
  } catch (error) {
    console.error('Ошибка при создании графика продаж:', error);
    res.status(500).json({ error: 'Ошибка сервера при создании графика' });
  }
});

// Получение статистики по категориям
app.get('/api/analytics/categories', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const categoryStats = await db('order_items')
      .join('products', 'order_items.product_id', 'products.id')
      .join('product_categories', 'products.id', 'product_categories.product_id')
      .join('categories', 'product_categories.category_id', 'categories.id')
      .join('orders', 'order_items.order_id', 'orders.id')
      .select('categories.id', 'categories.name')
      .sum('order_items.quantity as total_quantity')
      .sum(db.raw('order_items.quantity * order_items.price as total_revenue'))
      .where('orders.status', '!=', 'cancelled')
      .whereBetween('orders.created_at', [start, end])
      .groupBy('categories.id', 'categories.name')
      .orderBy('total_revenue', 'desc');
    
    res.json({
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      categories: categoryStats
    });
  } catch (error) {
    console.error('Ошибка при получении статистики по категориям:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении статистики' });
  }
});

// Экспорт данных в CSV
app.get('/api/analytics/export/sales', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
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
    
    // Формирование CSV
    const headers = ['ID', 'Номер заказа', 'Дата', 'Сумма', 'Статус', 'Метод оплаты', 'Статус оплаты', 'Покупатель', 'Email'];
    const rows = salesData.map(order => [
      order.id,
      order.order_number,
      new Date(order.created_at).toLocaleString('ru-RU'),
      order.total_amount,
      order.status,
      order.payment_method,
      order.payment_status,
      order.customer_name || 'Гость',
      order.email || '-'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=sales-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Ошибка при экспорте данных о продажах:', error);
    res.status(500).json({ error: 'Ошибка сервера при экспорте данных' });
  }
});

// Проверка здоровья сервера
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Analytics service is running' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`✅ Сервис аналитики запущен на порту ${PORT}`);
});
