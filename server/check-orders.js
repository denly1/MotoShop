import { db } from './db/index.js';

const checkOrders = async () => {
  try {
    console.log('📊 Проверка данных в базе...\n');
    
    const ordersCount = await db('orders').count('* as count').first();
    console.log(`📦 Заказов в базе: ${ordersCount.count}`);
    
    if (ordersCount.count === '0') {
      console.log('\n⚠️  В базе данных нет заказов!');
      console.log('Это нормально для новой установки.');
      console.log('Аналитика будет работать после создания первых заказов.\n');
    } else {
      const orders = await db('orders')
        .select('id', 'order_number', 'status', 'total_amount', 'created_at')
        .limit(5);
      
      console.log('\n📋 Последние заказы:');
      orders.forEach(o => {
        console.log(`   ${o.order_number} - ${o.status} - ${o.total_amount} руб. (${new Date(o.created_at).toLocaleDateString()})`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
};

checkOrders();
