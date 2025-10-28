import db from '../../db/index.js';
import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Экспорт товаров в CSV
 */
export const exportProductsCSV = async (req, res) => {
  try {
    console.log('📥 Экспорт товаров в CSV...');
    
    // Получаем все товары
    const products = await db('products')
      .leftJoin('inventory', 'products.id', 'inventory.product_id')
      .select(
        'products.id',
        'products.name',
        'products.sku',
        'products.brand',
        'products.price',
        'products.old_price',
        'products.is_active',
        'products.is_featured',
        'inventory.quantity'
      )
      .orderBy('products.id');
    
    // Создаем временную директорию
    const tempDir = path.join(__dirname, '..', '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Создаем файл CSV
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const csvFilePath = path.join(tempDir, `products_${timestamp}.csv`);
    
    const csvWriter = createObjectCsvWriter({
      path: csvFilePath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'name', title: 'Название' },
        { id: 'sku', title: 'Артикул' },
        { id: 'brand', title: 'Бренд' },
        { id: 'price', title: 'Цена' },
        { id: 'old_price', title: 'Старая цена' },
        { id: 'quantity', title: 'Количество' },
        { id: 'is_active', title: 'Активен' },
        { id: 'is_featured', title: 'Хит продаж' }
      ],
      encoding: 'utf8'
    });
    
    await csvWriter.writeRecords(products);
    
    // Отправляем файл
    res.download(csvFilePath, `products_${timestamp}.csv`, (err) => {
      if (err) {
        console.error('Ошибка при отправке файла:', err);
      }
      // Удаляем временный файл
      fs.unlink(csvFilePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Ошибка при удалении временного файла:', unlinkErr);
        }
      });
    });
    
    console.log('✅ Экспорт товаров завершен');
  } catch (error) {
    console.error('❌ Ошибка при экспорте товаров:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при экспорте товаров',
      error: error.message
    });
  }
};

/**
 * Экспорт заказов в CSV
 */
export const exportOrdersCSV = async (req, res) => {
  try {
    console.log('📥 Экспорт заказов в CSV...');
    
    const orders = await db('orders')
      .leftJoin('users', 'orders.user_id', 'users.id')
      .select(
        'orders.id',
        'orders.order_number',
        'orders.status',
        'orders.payment_status',
        'orders.total_amount',
        'orders.created_at',
        'users.email',
        'users.first_name',
        'users.last_name'
      )
      .orderBy('orders.created_at', 'desc');
    
    const tempDir = path.join(__dirname, '..', '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const csvFilePath = path.join(tempDir, `orders_${timestamp}.csv`);
    
    const csvWriter = createObjectCsvWriter({
      path: csvFilePath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'order_number', title: 'Номер заказа' },
        { id: 'email', title: 'Email клиента' },
        { id: 'first_name', title: 'Имя' },
        { id: 'last_name', title: 'Фамилия' },
        { id: 'total_amount', title: 'Сумма' },
        { id: 'status', title: 'Статус' },
        { id: 'payment_status', title: 'Статус оплаты' },
        { id: 'created_at', title: 'Дата создания' }
      ],
      encoding: 'utf8'
    });
    
    await csvWriter.writeRecords(orders);
    
    res.download(csvFilePath, `orders_${timestamp}.csv`, (err) => {
      if (err) {
        console.error('Ошибка при отправке файла:', err);
      }
      fs.unlink(csvFilePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Ошибка при удалении временного файла:', unlinkErr);
        }
      });
    });
    
    console.log('✅ Экспорт заказов завершен');
  } catch (error) {
    console.error('❌ Ошибка при экспорте заказов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при экспорте заказов',
      error: error.message
    });
  }
};

/**
 * Экспорт дашборда в CSV
 */
export const exportDashboardCSV = async (req, res) => {
  try {
    console.log('📥 Экспорт дашборда в CSV...');
    
    // Получаем статистику
    const stats = [];
    
    const ordersCount = await db('orders').count('* as count').first();
    stats.push({ metric: 'Всего заказов', value: ordersCount.count });
    
    const revenue = await db('orders')
      .whereNot('status', 'cancelled')
      .sum('total_amount as total')
      .first();
    stats.push({ metric: 'Общая выручка', value: revenue.total || 0 });
    
    const usersCount = await db('users').count('* as count').first();
    stats.push({ metric: 'Всего пользователей', value: usersCount.count });
    
    const productsCount = await db('products').count('* as count').first();
    stats.push({ metric: 'Всего товаров', value: productsCount.count });
    
    const tempDir = path.join(__dirname, '..', '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const csvFilePath = path.join(tempDir, `dashboard_${timestamp}.csv`);
    
    const csvWriter = createObjectCsvWriter({
      path: csvFilePath,
      header: [
        { id: 'metric', title: 'Метрика' },
        { id: 'value', title: 'Значение' }
      ],
      encoding: 'utf8'
    });
    
    await csvWriter.writeRecords(stats);
    
    res.download(csvFilePath, `dashboard_${timestamp}.csv`, (err) => {
      if (err) {
        console.error('Ошибка при отправке файла:', err);
      }
      fs.unlink(csvFilePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Ошибка при удалении временного файла:', unlinkErr);
        }
      });
    });
    
    console.log('✅ Экспорт дашборда завершен');
  } catch (error) {
    console.error('❌ Ошибка при экспорте дашборда:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при экспорте дашборда',
      error: error.message
    });
  }
};

export default {
  exportProductsCSV,
  exportOrdersCSV,
  exportDashboardCSV
};
