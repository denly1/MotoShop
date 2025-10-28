import db from '../../db/index.js';

/**
 * Получение общей статистики для дашборда
 */
export const getDashboardStats = async (req, res) => {
  try {
    console.log('📊 Получение статистики дашборда...');
    
    // Общая статистика
    const totalOrders = await db('orders').count('* as count').first();
    console.log('✅ Заказы:', totalOrders);
    
    const totalRevenue = await db('orders')
      .where('status', '!=', 'cancelled')
      .sum('total_amount as total')
      .first();
    console.log('✅ Выручка:', totalRevenue);
    
    const totalUsers = await db('users').count('* as count').first();
    console.log('✅ Пользователи:', totalUsers);
    
    const totalProducts = await db('products').where('is_active', true).count('* as count').first();
    console.log('✅ Товары:', totalProducts);

    // Статистика за последние 30 дней
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrders = await db('orders')
      .where('created_at', '>=', thirtyDaysAgo)
      .count('* as count')
      .first();
    
    const recentRevenue = await db('orders')
      .where('created_at', '>=', thirtyDaysAgo)
      .where('status', '!=', 'cancelled')
      .sum('total_amount as total')
      .first();
    
    const recentUsers = await db('users')
      .where('created_at', '>=', thirtyDaysAgo)
      .count('* as count')
      .first();

    // Топ-5 товаров
    const topProducts = await db('order_items')
      .join('products', 'order_items.product_id', 'products.id')
      .join('orders', 'order_items.order_id', 'orders.id')
      .where('orders.status', '!=', 'cancelled')
      .select('products.id', 'products.name', 'products.image_url')
      .sum('order_items.quantity as total_sold')
      .sum(db.raw('order_items.quantity * order_items.price as revenue'))
      .groupBy('products.id', 'products.name', 'products.image_url')
      .orderBy('total_sold', 'desc')
      .limit(5);

    // Последние заказы
    const recentOrdersList = await db('orders')
      .select(
        'orders.id',
        'orders.order_number',
        'orders.status',
        'orders.total_amount',
        'orders.created_at',
        'users.first_name',
        'users.last_name',
        'users.email'
      )
      .leftJoin('users', 'orders.user_id', 'users.id')
      .orderBy('orders.created_at', 'desc')
      .limit(10);

    // Статистика по статусам заказов
    const ordersByStatus = await db('orders')
      .select('status')
      .count('* as count')
      .groupBy('status');

    // График продаж за последние 7 дней
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const salesChart = await db('orders')
      .select(db.raw("TO_CHAR(created_at, 'YYYY-MM-DD') as date"))
      .count('* as orders')
      .sum('total_amount as revenue')
      .where('created_at', '>=', sevenDaysAgo)
      .where('status', '!=', 'cancelled')
      .groupBy(db.raw("TO_CHAR(created_at, 'YYYY-MM-DD')"))
      .orderBy('date');

    res.json({
      success: true,
      stats: {
        total: {
          orders: parseInt(totalOrders.count) || 0,
          revenue: parseFloat(totalRevenue.total) || 0,
          users: parseInt(totalUsers.count) || 0,
          products: parseInt(totalProducts.count) || 0
        },
        recent: {
          orders: parseInt(recentOrders.count) || 0,
          revenue: parseFloat(recentRevenue.total) || 0,
          users: parseInt(recentUsers.count) || 0
        },
        topProducts: topProducts.map(p => ({
          ...p,
          total_sold: parseInt(p.total_sold),
          revenue: parseFloat(p.revenue)
        })),
        recentOrders: recentOrdersList,
        ordersByStatus: ordersByStatus.map(s => ({
          status: s.status,
          count: parseInt(s.count)
        })),
        salesChart: salesChart.map(s => ({
          date: s.date,
          orders: parseInt(s.orders),
          revenue: parseFloat(s.revenue)
        }))
      }
    });
  } catch (error) {
    console.error('Ошибка при получении статистики дашборда:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статистики дашборда',
      error: error.message
    });
  }
};

/**
 * Получение статистики по товарам
 */
export const getProductsStats = async (req, res) => {
  try {
    // Общее количество товаров
    const totalProducts = await db('products').count('* as count').first();
    const activeProducts = await db('products').where('is_active', true).count('* as count').first();
    const featuredProducts = await db('products').where('is_featured', true).count('* as count').first();

    // Товары с низким остатком
    const lowStockProducts = await db('products')
      .join('inventory', 'products.id', 'inventory.product_id')
      .select('products.id', 'products.name', 'products.sku', 'inventory.quantity')
      .where('inventory.quantity', '<', 10)
      .orderBy('inventory.quantity', 'asc')
      .limit(10);

    // Товары по категориям
    const productsByCategory = await db('categories')
      .leftJoin('product_categories', 'categories.id', 'product_categories.category_id')
      .leftJoin('products', 'product_categories.product_id', 'products.id')
      .select('categories.name')
      .count('products.id as count')
      .where('categories.parent_id', null)
      .groupBy('categories.id', 'categories.name')
      .orderBy('count', 'desc');

    res.json({
      success: true,
      stats: {
        total: parseInt(totalProducts.count) || 0,
        active: parseInt(activeProducts.count) || 0,
        featured: parseInt(featuredProducts.count) || 0,
        lowStock: lowStockProducts,
        byCategory: productsByCategory.map(c => ({
          category: c.name,
          count: parseInt(c.count) || 0
        }))
      }
    });
  } catch (error) {
    console.error('Ошибка при получении статистики товаров:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статистики товаров',
      error: error.message
    });
  }
};

/**
 * Получение статистики по пользователям
 */
export const getUsersStats = async (req, res) => {
  try {
    // Общее количество пользователей
    const totalUsers = await db('users').count('* as count').first();
    const activeUsers = await db('users').where('is_active', true).count('* as count').first();

    // Пользователи по ролям
    const usersByRole = await db('roles')
      .leftJoin('user_roles', 'roles.id', 'user_roles.role_id')
      .select('roles.name')
      .count('user_roles.user_id as count')
      .groupBy('roles.id', 'roles.name')
      .orderBy('count', 'desc');

    // Новые пользователи за последние 30 дней
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsers = await db('users')
      .where('created_at', '>=', thirtyDaysAgo)
      .count('* as count')
      .first();

    // Топ покупателей
    const topCustomers = await db('users')
      .join('orders', 'users.id', 'orders.user_id')
      .select(
        'users.id',
        'users.first_name',
        'users.last_name',
        'users.email'
      )
      .count('orders.id as order_count')
      .sum('orders.total_amount as total_spent')
      .where('orders.status', '!=', 'cancelled')
      .groupBy('users.id', 'users.first_name', 'users.last_name', 'users.email')
      .orderBy('total_spent', 'desc')
      .limit(10);

    res.json({
      success: true,
      stats: {
        total: parseInt(totalUsers.count) || 0,
        active: parseInt(activeUsers.count) || 0,
        new: parseInt(newUsers.count) || 0,
        byRole: usersByRole.map(r => ({
          role: r.name,
          count: parseInt(r.count) || 0
        })),
        topCustomers: topCustomers.map(c => ({
          ...c,
          order_count: parseInt(c.order_count),
          total_spent: parseFloat(c.total_spent)
        }))
      }
    });
  } catch (error) {
    console.error('Ошибка при получении статистики пользователей:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статистики пользователей',
      error: error.message
    });
  }
};

/**
 * Получение статистики по заказам
 */
export const getOrdersStats = async (req, res) => {
  try {
    // Общее количество заказов
    const totalOrders = await db('orders').count('* as count').first();
    
    // Заказы по статусам
    const ordersByStatus = await db('orders')
      .select('status')
      .count('* as count')
      .groupBy('status');

    // Средний чек
    const avgOrderValue = await db('orders')
      .where('status', '!=', 'cancelled')
      .avg('total_amount as avg')
      .first();

    // Заказы за последние 30 дней
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrders = await db('orders')
      .where('created_at', '>=', thirtyDaysAgo)
      .count('* as count')
      .first();

    // График заказов по дням за последние 14 дней
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const ordersChart = await db('orders')
      .select(db.raw("TO_CHAR(created_at, 'YYYY-MM-DD') as date"))
      .count('* as count')
      .where('created_at', '>=', fourteenDaysAgo)
      .groupBy(db.raw("TO_CHAR(created_at, 'YYYY-MM-DD')"))
      .orderBy('date');

    res.json({
      success: true,
      stats: {
        total: parseInt(totalOrders.count) || 0,
        recent: parseInt(recentOrders.count) || 0,
        avgValue: parseFloat(avgOrderValue.avg) || 0,
        byStatus: ordersByStatus.map(s => ({
          status: s.status,
          count: parseInt(s.count)
        })),
        chart: ordersChart.map(o => ({
          date: o.date,
          count: parseInt(o.count)
        }))
      }
    });
  } catch (error) {
    console.error('Ошибка при получении статистики заказов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статистики заказов',
      error: error.message
    });
  }
};

export default {
  getDashboardStats,
  getProductsStats,
  getUsersStats,
  getOrdersStats
};
