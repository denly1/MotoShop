/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export async function seed(knex) {
  // Очистка таблицы отзывов
  await knex('reviews').del();
  
  // Получение пользователей
  const users = await knex('users').select('id');
  
  // Получение продуктов
  const products = await knex('products').select('id');
  
  // Массивы возможных комментариев
  const positiveComments = [
    'Отличный товар, полностью соответствует описанию!',
    'Очень доволен покупкой, рекомендую всем!',
    'Качество на высоте, буду заказывать еще.',
    'Доставили быстро, товар в идеальном состоянии.',
    'Превзошло все мои ожидания!',
    'Лучшая покупка в этом году.',
    'Идеальное соотношение цены и качества.'
  ];
  
  const neutralComments = [
    'Нормальный товар, соответствует цене.',
    'В целом неплохо, но есть небольшие недочеты.',
    'Ожидал большего, но за эти деньги сойдет.',
    'Средний товар, ничего особенного.',
    'Выполняет свои функции, но не более того.'
  ];
  
  const negativeComments = [
    'Не соответствует описанию, разочарован.',
    'Качество оставляет желать лучшего.',
    'Слишком дорого для такого качества.',
    'Были проблемы с доставкой и товаром.',
    'Не рекомендую, есть варианты лучше.'
  ];
  
  const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
  const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6); // 6 месяцев назад
  
  const reviews = [];
  
  // Создание отзывов для каждого продукта
  for (const product of products) {
    // Случайное количество отзывов для продукта (0-5)
    const reviewCount = Math.floor(Math.random() * 6);
    
    // Создание отзывов
    for (let i = 0; i < reviewCount; i++) {
      const rating = Math.floor(Math.random() * 5) + 1; // Рейтинг от 1 до 5
      let comment;
      
      // Выбор комментария в зависимости от рейтинга
      if (rating >= 4) {
        comment = getRandomElement(positiveComments);
      } else if (rating === 3) {
        comment = getRandomElement(neutralComments);
      } else {
        comment = getRandomElement(negativeComments);
      }
      
      const userId = getRandomElement(users).id;
      const reviewDate = getRandomDate(startDate, new Date());
      const isApproved = Math.random() > 0.2; // 80% отзывов одобрены
      
      reviews.push({
        product_id: product.id,
        user_id: userId,
        rating,
        comment,
        is_approved: isApproved,
        created_at: reviewDate,
        updated_at: reviewDate
      });
    }
  }
  
  // Вставка всех отзывов
  if (reviews.length > 0) {
    await knex('reviews').insert(reviews);
  }
}
