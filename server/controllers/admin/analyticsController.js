import db from '../../db/index.js';
import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Получение статистики продаж
 */
export const getSalesStatistics = async (req, res) => {
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
        COUNT(DISTINCT o.id)::integer as total_orders,
        COALESCE(SUM(o.total_amount), 0)::numeric as total_revenue,
        COALESCE(AVG(o.total_amount), 0)::numeric as average_order_value,
        COUNT(DISTINCT o.user_id)::integer as unique_customers
      FROM orders o
      WHERE o.created_at BETWEEN ? AND ?
        AND o.status != 'cancelled'
      GROUP BY DATE_TRUNC('${groupBy}', o.created_at)
      ORDER BY DATE_TRUNC('${groupBy}', o.created_at)
    `, [startDate, endDate]);

    res.json({
      success: true,
      statistics: salesStats.rows || [],
      period: {
        startDate,
        endDate,
        groupBy
      }
    });
  } catch (error) {
    console.error('Ошибка при получении статистики продаж:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статистики продаж',
      error: error.message
    });
  }
};

/**
 * Получение статистики по категориям
 */
export const getCategoryStatistics = async (req, res) => {
  try {
    const { 
      startDate = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], 
      endDate = new Date().toISOString().split('T')[0]
    } = req.query;

    const categoryStats = await db.raw(`
      SELECT 
        c.id as category_id,
        c.name as category_name,
        COUNT(DISTINCT oi.order_id) as total_orders,
        SUM(oi.quantity) as total_items_sold,
        SUM(oi.price * oi.quantity) as total_revenue
      FROM categories c
      JOIN product_categories pc ON c.id = pc.category_id
      JOIN products p ON pc.product_id = p.id
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at BETWEEN ? AND ?
        AND o.status != 'cancelled'
      GROUP BY c.id, c.name
      ORDER BY total_revenue DESC
    `, [startDate, endDate]);

    res.json({
      success: true,
      statistics: categoryStats.rows,
      period: {
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error('Ошибка при получении статистики по категориям:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статистики по категориям',
      error: error.message
    });
  }
};

/**
 * Получение статистики по пользователям
 */
export const getUserStatistics = async (req, res) => {
  try {
    const userStats = await db.raw(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        COUNT(DISTINCT o.id) as total_orders,
        SUM(o.total_amount) as total_spent,
        AVG(o.total_amount) as average_order_value,
        MIN(o.created_at) as first_order_date,
        MAX(o.created_at) as last_order_date
      FROM users u
      JOIN orders o ON u.id = o.user_id
      WHERE o.status != 'cancelled'
      GROUP BY u.id, u.email, u.first_name, u.last_name
      ORDER BY total_spent DESC
    `);

    res.json({
      success: true,
      statistics: userStats.rows
    });
  } catch (error) {
    console.error('Ошибка при получении статистики по пользователям:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статистики по пользователям',
      error: error.message
    });
  }
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

    // Создание временного файла для CSV
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const csvFilePath = path.join(__dirname, '..', '..', 'temp', `sales_statistics_${timestamp}.csv`);
    
    // Создание директории, если она не существует
    const tempDir = path.join(__dirname, '..', '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Настройка CSV Writer
    const csvWriter = createObjectCsvWriter({
      path: csvFilePath,
      header: [
        { id: 'period', title: 'Период' },
        { id: 'total_orders', title: 'Количество заказов' },
        { id: 'total_revenue', title: 'Общая выручка' },
        { id: 'average_order_value', title: 'Средний чек' },
        { id: 'unique_customers', title: 'Уникальные клиенты' }
      ]
    });

    // Запись данных в CSV
    await csvWriter.writeRecords(salesStats.rows);

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
 * Получение топ продаваемых товаров
 */
export const getTopSellingProducts = async (req, res) => {
  try {
    const { 
      startDate = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], 
      endDate = new Date().toISOString().split('T')[0],
      limit = 10
    } = req.query;

    const topProducts = await db.raw(`
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.price,
        p.image_url,
        SUM(oi.quantity) as total_sold,
        COUNT(DISTINCT o.id) as order_count,
        SUM(oi.price * oi.quantity) as total_revenue
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at BETWEEN ? AND ?
        AND o.status != 'cancelled'
      GROUP BY p.id, p.name, p.slug, p.price, p.image_url
      ORDER BY total_sold DESC
      LIMIT ?
    `, [startDate, endDate, limit]);

    res.json({
      success: true,
      products: topProducts.rows,
      period: {
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error('Ошибка при получении топ продаваемых товаров:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении топ продаваемых товаров',
      error: error.message
    });
  }
};

/**
 * Получение статистики по статусам заказов
 */
export const getOrderStatusStatistics = async (req, res) => {
  try {
    const { 
      startDate = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], 
      endDate = new Date().toISOString().split('T')[0]
    } = req.query;

    const statusStats = await db.raw(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total_amount) as total_amount
      FROM orders
      WHERE created_at BETWEEN ? AND ?
      GROUP BY status
      ORDER BY count DESC
    `, [startDate, endDate]);

    res.json({
      success: true,
      statistics: statusStats.rows,
      period: {
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error('Ошибка при получении статистики по статусам заказов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статистики по статусам заказов',
      error: error.message
    });
  }
};
