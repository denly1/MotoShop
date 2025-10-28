/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export async function seed(knex) {
  // Очистка таблиц
  await knex('order_items').del();
  await knex('orders').del();
  
  // Получение пользователей
  const users = await knex('users').select('id');
  
  // Получение продуктов
  const products = await knex('products').select('id', 'name', 'price');
  
  // Генерация случайных заказов
  const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const paymentMethods = ['card', 'cash'];
  const paymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
  
  const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
  const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3); // 3 месяца назад
  
  const orders = [];
  
  // Создание 20 заказов
  for (let i = 1; i <= 20; i++) {
    const orderDate = getRandomDate(startDate, new Date());
    const userId = getRandomElement(users).id;
    const status = getRandomElement(orderStatuses);
    const paymentMethod = getRandomElement(paymentMethods);
    const paymentStatus = status === 'cancelled' ? 'refunded' : getRandomElement(paymentStatuses);
    
    // Случайное количество товаров в заказе (1-5)
    const orderProductCount = Math.floor(Math.random() * 5) + 1;
    const orderProducts = [];
    
    // Выбор случайных товаров без повторений
    const availableProducts = [...products];
    for (let j = 0; j < orderProductCount; j++) {
      if (availableProducts.length === 0) break;
      
      const randomIndex = Math.floor(Math.random() * availableProducts.length);
      const product = availableProducts.splice(randomIndex, 1)[0];
      
      const quantity = Math.floor(Math.random() * 3) + 1;
      orderProducts.push({
        product_id: product.id,
        product_name: product.name,
        quantity,
        price: product.price
      });
    }
    
    // Расчет общей суммы заказа
    const totalAmount = orderProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Создание заказа
    const [orderId] = await knex('orders').insert({
      order_number: `MS-${Date.now()}-${i}`,
      user_id: userId,
      status,
      total_amount: totalAmount,
      shipping_address: 'ул. Примерная, д. 123, кв. 45',
      shipping_city: 'Москва',
      shipping_postal_code: '123456',
      shipping_country: 'Россия',
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      notes: 'Тестовый заказ',
      created_at: orderDate,
      updated_at: orderDate
    }).returning('id');
    
    // Добавление позиций заказа
    for (const item of orderProducts) {
      await knex('order_items').insert({
        order_id: orderId,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        created_at: orderDate
      });
      
      // Обновление зарезервированного количества товара, если заказ не отменен и не доставлен
      if (status !== 'cancelled' && status !== 'delivered') {
        await knex('inventory')
          .where('product_id', item.product_id)
          .increment('reserved_quantity', item.quantity);
      }
    }
    
    orders.push({
      id: orderId,
      total: totalAmount,
      status,
      created_at: orderDate
    });
  }
}
