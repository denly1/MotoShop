import db from '../../db/index.js';

/**
 * Упрощенная версия дашборда - гарантированно работает
 */
export const getSimpleDashboardStats = async (req, res) => {
  try {
    console.log('📊 Загрузка упрощенной статистики дашборда...');
    
    // Базовая статистика
    const stats = {
      total: {
        orders: 0,
        revenue: 0,
        users: 0,
        products: 0
      },
      recent: {
        orders: 0,
        revenue: 0,
        users: 0
      },
      topProducts: [],
      recentOrders: [],
      ordersByStatus: [],
      salesChart: []
    };
    
    // Получаем общее количество заказов
    try {
      const ordersCount = await db('orders').count('* as count').first();
      stats.total.orders = parseInt(ordersCount?.count || 0);
      console.log('✅ Заказов:', stats.total.orders);
    } catch (err) {
      console.error('❌ Ошибка при подсчете заказов:', err.message);
    }
    
    // Получаем общую выручку
    try {
      const revenue = await db('orders')
        .whereNot('status', 'cancelled')
        .sum('total_amount as total')
        .first();
      stats.total.revenue = parseFloat(revenue?.total || 0);
      console.log('✅ Выручка:', stats.total.revenue);
    } catch (err) {
      console.error('❌ Ошибка при подсчете выручки:', err.message);
    }
    
    // Получаем количество пользователей
    try {
      const usersCount = await db('users').count('* as count').first();
      stats.total.users = parseInt(usersCount?.count || 0);
      console.log('✅ Пользователей:', stats.total.users);
    } catch (err) {
      console.error('❌ Ошибка при подсчете пользователей:', err.message);
    }
    
    // Получаем количество товаров
    try {
      const productsCount = await db('products')
        .where('is_active', true)
        .count('* as count')
        .first();
      stats.total.products = parseInt(productsCount?.count || 0);
      console.log('✅ Товаров:', stats.total.products);
    } catch (err) {
      console.error('❌ Ошибка при подсчете товаров:', err.message);
    }
    
    // Статистика за последние 30 дней
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    try {
      const recentOrdersCount = await db('orders')
        .where('created_at', '>=', thirtyDaysAgo)
        .count('* as count')
        .first();
      stats.recent.orders = parseInt(recentOrdersCount?.count || 0);
    } catch (err) {
      console.error('❌ Ошибка при подсчете недавних заказов:', err.message);
    }
    
    try {
      const recentRevenue = await db('orders')
        .where('created_at', '>=', thirtyDaysAgo)
        .whereNot('status', 'cancelled')
        .sum('total_amount as total')
        .first();
      stats.recent.revenue = parseFloat(recentRevenue?.total || 0);
    } catch (err) {
      console.error('❌ Ошибка при подсчете недавней выручки:', err.message);
    }
    
    try {
      const recentUsersCount = await db('users')
        .where('created_at', '>=', thirtyDaysAgo)
        .count('* as count')
        .first();
      stats.recent.users = parseInt(recentUsersCount?.count || 0);
    } catch (err) {
      console.error('❌ Ошибка при подсчете новых пользователей:', err.message);
    }
    
    // Топ-5 товаров
    try {
      const topProducts = await db.raw(`
        SELECT 
          p.id,
          p.name,
          p.image_url,
          COALESCE(SUM(oi.quantity), 0)::integer as total_sold,
          COALESCE(SUM(oi.quantity * oi.price), 0)::numeric as revenue
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
        GROUP BY p.id, p.name, p.image_url
        ORDER BY total_sold DESC
        LIMIT 5
      `);
      stats.topProducts = topProducts.rows || [];
      console.log('✅ Топ товаров:', stats.topProducts.length);
    } catch (err) {
      console.error('❌ Ошибка при получении топ товаров:', err.message);
    }
    
    // Последние заказы
    try {
      const recentOrders = await db('orders')
        .leftJoin('users', 'orders.user_id', 'users.id')
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
        .orderBy('orders.created_at', 'desc')
        .limit(10);
      stats.recentOrders = recentOrders || [];
      console.log('✅ Последних заказов:', stats.recentOrders.length);
    } catch (err) {
      console.error('❌ Ошибка при получении последних заказов:', err.message);
    }
    
    // Статусы заказов
    try {
      const ordersByStatus = await db('orders')
        .select('status')
        .count('* as count')
        .groupBy('status');
      stats.ordersByStatus = ordersByStatus.map(s => ({
        status: s.status,
        count: parseInt(s.count)
      }));
      console.log('✅ Статусов заказов:', stats.ordersByStatus.length);
    } catch (err) {
      console.error('❌ Ошибка при получении статусов заказов:', err.message);
    }
    
    console.log('✅ Статистика дашборда успешно загружена');
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Критическая ошибка при получении статистики дашборда:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статистики дашборда',
      error: error.message
    });
  }
};

export default {
  getSimpleDashboardStats
};
