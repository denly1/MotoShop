import db from '../../db/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Создание директории для временных файлов, если она не существует
const tempDir = path.join(__dirname, '..', '..', 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * Генерация CSV-строки из массива данных
 * @param {Array} data - Массив объектов данных
 * @param {Array} headers - Массив заголовков столбцов
 * @returns {String} CSV-строка
 */
const generateCSV = (data, headers) => {
  // Создание строки заголовков
  const headerRow = headers.map(h => `"${h.title}"`).join(',');
  
  // Создание строк данных
  const rows = data.map(item => {
    return headers.map(header => {
      const value = item[header.id];
      return `"${value !== undefined && value !== null ? value : ''}"`;
    }).join(',');
  });
  
  // Объединение всех строк
  return [headerRow, ...rows].join('\n');
};

/**
 * Экспорт статистики продаж в CSV
 */
export const exportSalesStatisticsCSV = async (req, res) => {
  try {
    const { 
      startDate = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], 
      endDate = new Date().toISOString().split('T')[0],
      groupBy = 'day'
    } = req.query;

    let dateFormat;
    switch (groupBy) {
      case 'month':
        dateFormat = 'YYYY-MM-01';
        break;
      case 'week':
        dateFormat = 'YYYY-"W"IW';
        break;
      case 'day':
      default:
        dateFormat = 'YYYY-MM-DD';
        break;
    }

    const salesStats = await db.raw(`
      SELECT 
        TO_CHAR(DATE_TRUNC('${groupBy}', o.created_at), '${dateFormat}') as period,
        COUNT(DISTINCT o.id) as total_orders,
        SUM(o.total_amount) as total_revenue,
        AVG(o.total_amount) as average_order_value,
        COUNT(DISTINCT o.user_id) as unique_customers
      FROM orders o
      WHERE o.created_at BETWEEN ? AND ?
      GROUP BY DATE_TRUNC('${groupBy}', o.created_at)
      ORDER BY DATE_TRUNC('${groupBy}', o.created_at)
    `, [startDate, endDate]);

    // Определение заголовков
    const headers = [
      { id: 'period', title: 'Период' },
      { id: 'total_orders', title: 'Количество заказов' },
      { id: 'total_revenue', title: 'Общая выручка' },
      { id: 'average_order_value', title: 'Средний чек' },
      { id: 'unique_customers', title: 'Уникальные клиенты' }
    ];

    // Генерация CSV
    const csvContent = generateCSV(salesStats.rows, headers);

    // Создание временного файла
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const csvFilePath = path.join(tempDir, `sales_statistics_${timestamp}.csv`);
    fs.writeFileSync(csvFilePath, csvContent);

    // Отправка файла клиенту
    res.download(csvFilePath, `sales_statistics_${startDate}_to_${endDate}.csv`, (err) => {
      if (err) {
        console.error('Ошибка при отправке файла:', err);
      }
      
      // Удаление временного файла после отправки
      fs.unlink(csvFilePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Ошибка при удалении временного файла:', unlinkErr);
        }
      });
    });
  } catch (error) {
    console.error('Ошибка при экспорте статистики продаж:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при экспорте статистики продаж',
      error: error.message
    });
  }
};

/**
 * Экспорт списка товаров в CSV
 */
export const exportProductsCSV = async (req, res) => {
  try {
    const { category } = req.query;

    // Базовый запрос
    let query = db('products')
      .select(
        'products.id',
        'products.name',
        'products.sku',
        'products.price',
        'products.old_price',
        'products.brand',
        'products.is_active',
        'products.is_featured',
        'products.created_at'
      );

    // Фильтрация по категории
    if (category) {
      query = query
        .join('product_categories', 'products.id', 'product_categories.product_id')
        .where('product_categories.category_id', category);
    }

    const products = await query.orderBy('products.name');

    // Получение складских остатков для каждого товара
    const productsWithInventory = await Promise.all(products.map(async (product) => {
      const inventory = await db('inventory')
        .where('product_id', product.id)
        .first();

      return {
        ...product,
        quantity: inventory ? inventory.quantity : 0,
        reserved_quantity: inventory ? inventory.reserved_quantity : 0
      };
    }));

    // Определение заголовков
    const headers = [
      { id: 'id', title: 'ID' },
      { id: 'name', title: 'Название' },
      { id: 'sku', title: 'Артикул' },
      { id: 'price', title: 'Цена' },
      { id: 'old_price', title: 'Старая цена' },
      { id: 'brand', title: 'Бренд' },
      { id: 'quantity', title: 'Количество' },
      { id: 'reserved_quantity', title: 'Зарезервировано' },
      { id: 'is_active', title: 'Активен' },
      { id: 'is_featured', title: 'Рекомендуемый' },
      { id: 'created_at', title: 'Дата создания' }
    ];

    // Генерация CSV
    const csvContent = generateCSV(productsWithInventory, headers);

    // Создание временного файла
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const csvFilePath = path.join(tempDir, `products_${timestamp}.csv`);
    fs.writeFileSync(csvFilePath, csvContent);

    // Отправка файла клиенту
    res.download(csvFilePath, `products_${timestamp}.csv`, (err) => {
      if (err) {
        console.error('Ошибка при отправке файла:', err);
      }
      
      // Удаление временного файла после отправки
      fs.unlink(csvFilePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Ошибка при удалении временного файла:', unlinkErr);
        }
      });
    });
  } catch (error) {
    console.error('Ошибка при экспорте списка товаров:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при экспорте списка товаров',
      error: error.message
    });
  }
};

/**
 * Экспорт списка заказов в CSV
 */
export const exportOrdersCSV = async (req, res) => {
  try {
    const { 
      startDate = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], 
      endDate = new Date().toISOString().split('T')[0],
      status
    } = req.query;

    // Базовый запрос
    let query = db('orders')
      .select(
        'orders.id',
        'orders.order_number',
        'orders.status',
        'orders.total_amount',
        'orders.payment_method',
        'orders.payment_status',
        'orders.created_at',
        'users.email as user_email',
        'users.first_name',
        'users.last_name',
        'users.phone'
      )
      .leftJoin('users', 'orders.user_id', 'users.id')
      .whereBetween('orders.created_at', [startDate, endDate]);

    // Фильтрация по статусу
    if (status) {
      query = query.where('orders.status', status);
    }

    const orders = await query.orderBy('orders.created_at', 'desc');

    // Определение заголовков
    const headers = [
      { id: 'id', title: 'ID' },
      { id: 'order_number', title: 'Номер заказа' },
      { id: 'user_email', title: 'Email клиента' },
      { id: 'first_name', title: 'Имя' },
      { id: 'last_name', title: 'Фамилия' },
      { id: 'phone', title: 'Телефон' },
      { id: 'total_amount', title: 'Сумма заказа' },
      { id: 'status', title: 'Статус заказа' },
      { id: 'payment_method', title: 'Способ оплаты' },
      { id: 'payment_status', title: 'Статус оплаты' },
      { id: 'created_at', title: 'Дата создания' }
    ];

    // Генерация CSV
    const csvContent = generateCSV(orders, headers);

    // Создание временного файла
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const csvFilePath = path.join(tempDir, `orders_${timestamp}.csv`);
    fs.writeFileSync(csvFilePath, csvContent);

    // Отправка файла клиенту
    res.download(csvFilePath, `orders_${startDate}_to_${endDate}.csv`, (err) => {
      if (err) {
        console.error('Ошибка при отправке файла:', err);
      }
      
      // Удаление временного файла после отправки
      fs.unlink(csvFilePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Ошибка при удалении временного файла:', unlinkErr);
        }
      });
    });
  } catch (error) {
    console.error('Ошибка при экспорте списка заказов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при экспорте списка заказов',
      error: error.message
    });
  }
};

/**
 * Экспорт списка клиентов в CSV
 */
export const exportCustomersCSV = async (req, res) => {
  try {
    // Получение списка клиентов с ролью 'customer'
    const customers = await db('users')
      .select(
        'users.id',
        'users.email',
        'users.first_name',
        'users.last_name',
        'users.phone',
        'users.is_active',
        'users.created_at'
      )
      .join('user_roles', 'users.id', 'user_roles.user_id')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('roles.name', 'customer')
      .orderBy('users.created_at', 'desc');

    // Получение статистики заказов для каждого клиента
    const customersWithStats = await Promise.all(customers.map(async (customer) => {
      const orderStats = await db('orders')
        .where('user_id', customer.id)
        .select(
          db.raw('COUNT(id) as total_orders'),
          db.raw('SUM(total_amount) as total_spent'),
          db.raw('MAX(created_at) as last_order_date')
        )
        .first();

      return {
        ...customer,
        total_orders: orderStats.total_orders || 0,
        total_spent: orderStats.total_spent || 0,
        last_order_date: orderStats.last_order_date || null
      };
    }));

    // Определение заголовков
    const headers = [
      { id: 'id', title: 'ID' },
      { id: 'email', title: 'Email' },
      { id: 'first_name', title: 'Имя' },
      { id: 'last_name', title: 'Фамилия' },
      { id: 'phone', title: 'Телефон' },
      { id: 'is_active', title: 'Активен' },
      { id: 'total_orders', title: 'Количество заказов' },
      { id: 'total_spent', title: 'Сумма покупок' },
      { id: 'last_order_date', title: 'Дата последнего заказа' },
      { id: 'created_at', title: 'Дата регистрации' }
    ];

    // Генерация CSV
    const csvContent = generateCSV(customersWithStats, headers);

    // Создание временного файла
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const csvFilePath = path.join(tempDir, `customers_${timestamp}.csv`);
    fs.writeFileSync(csvFilePath, csvContent);

    // Отправка файла клиенту
    res.download(csvFilePath, `customers_${timestamp}.csv`, (err) => {
      if (err) {
        console.error('Ошибка при отправке файла:', err);
      }
      
      // Удаление временного файла после отправки
      fs.unlink(csvFilePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Ошибка при удалении временного файла:', unlinkErr);
        }
      });
    });
  } catch (error) {
    console.error('Ошибка при экспорте списка клиентов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при экспорте списка клиентов',
      error: error.message
    });
  }
};

/**
 * Получение данных для дашборда
 */
export const getDashboardData = async (req, res) => {
  try {
    // Получение статистики заказов
    const orderStats = await db('orders')
      .select(
        db.raw('COUNT(id) as total_orders'),
        db.raw('SUM(total_amount) as total_revenue'),
        db.raw('AVG(total_amount) as average_order_value')
      )
      .first();

    // Получение статистики по статусам заказов
    const orderStatusStats = await db('orders')
      .select('status')
      .count('id as count')
      .groupBy('status');

    // Получение количества клиентов
    const customerCount = await db('users')
      .join('user_roles', 'users.id', 'user_roles.user_id')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('roles.name', 'customer')
      .count('users.id as count')
      .first();

    // Получение количества товаров
    const productCount = await db('products')
      .count('id as count')
      .first();

    // Получение топ-5 продаваемых товаров
    const topProducts = await db.raw(`
      SELECT 
        p.id,
        p.name,
        p.price,
        SUM(oi.quantity) as total_sold,
        SUM(oi.price * oi.quantity) as total_revenue
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY p.id, p.name, p.price
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    // Получение статистики продаж за последние 7 дней
    const last7DaysSales = await db.raw(`
      SELECT 
        TO_CHAR(DATE_TRUNC('day', o.created_at), 'YYYY-MM-DD') as date,
        COUNT(DISTINCT o.id) as total_orders,
        SUM(o.total_amount) as total_revenue
      FROM orders o
      WHERE o.created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE_TRUNC('day', o.created_at)
      ORDER BY DATE_TRUNC('day', o.created_at)
    `);

    res.json({
      success: true,
      data: {
        orderStats,
        orderStatusStats,
        customerCount,
        productCount,
        topProducts: topProducts.rows,
        last7DaysSales: last7DaysSales.rows
      }
    });
  } catch (error) {
    console.error('Ошибка при получении данных для дашборда:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении данных для дашборда',
      error: error.message
    });
  }
};

/**
 * Получение данных для дашборда менеджера
 */
export const getManagerDashboardData = async (req, res) => {
  try {
    // Получение статистики заказов за сегодня
    const today = new Date().toISOString().split('T')[0];
    const todayOrderStats = await db('orders')
      .whereRaw(`DATE(created_at) = ?`, [today])
      .select(
        db.raw('COUNT(id) as total_orders'),
        db.raw('SUM(total_amount) as total_revenue')
      )
      .first();

    // Получение статистики по статусам заказов
    const pendingOrders = await db('orders')
      .where('status', 'pending')
      .count('id as count')
      .first();

    // Получение последних 10 заказов
    const recentOrders = await db('orders')
      .select(
        'orders.id',
        'orders.order_number',
        'orders.status',
        'orders.total_amount',
        'orders.created_at',
        'users.email as user_email',
        'users.first_name',
        'users.last_name'
      )
      .leftJoin('users', 'orders.user_id', 'users.id')
      .orderBy('orders.created_at', 'desc')
      .limit(10);

    // Получение товаров с низким запасом
    const lowStockProducts = await db('products')
      .select(
        'products.id',
        'products.name',
        'products.sku',
        'inventory.quantity',
        'inventory.reserved_quantity'
      )
      .join('inventory', 'products.id', 'inventory.product_id')
      .where('inventory.quantity', '<', 5)
      .andWhere('products.is_active', true)
      .orderBy('inventory.quantity')
      .limit(10);

    res.json({
      success: true,
      data: {
        todayOrderStats,
        pendingOrders,
        recentOrders,
        lowStockProducts
      }
    });
  } catch (error) {
    console.error('Ошибка при получении данных для дашборда менеджера:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении данных для дашборда менеджера',
      error: error.message
    });
  }
};

export default {
  exportSalesStatisticsCSV,
  exportProductsCSV,
  exportOrdersCSV,
  exportCustomersCSV,
  getDashboardData,
  getManagerDashboardData
};
