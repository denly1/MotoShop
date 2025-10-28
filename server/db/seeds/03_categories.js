/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export async function seed(knex) {
  // Очистка таблицы категорий
  await knex('categories').del();
  
  // Вставка категорий
  const motorcyclesResult = await knex('categories').insert({
    name: 'Мотоциклы',
    slug: 'motorcycles',
    description: 'Все виды мотоциклов для дорог и бездорожья',
    image_url: '/images/categories/motorcycles.jpg',
    is_active: true
  }).returning('id');
  const motorcyclesId = motorcyclesResult[0].id || motorcyclesResult[0];
  
  const gearResult = await knex('categories').insert({
    name: 'Экипировка',
    slug: 'gear',
    description: 'Защитная экипировка для мотоциклистов',
    image_url: '/images/categories/gear.jpg',
    is_active: true
  }).returning('id');
  const gearId = gearResult[0].id || gearResult[0];
  
  const partsResult = await knex('categories').insert({
    name: 'Запчасти',
    slug: 'parts',
    description: 'Запасные части для мотоциклов',
    image_url: '/images/categories/parts.jpg',
    is_active: true
  }).returning('id');
  const partsId = partsResult[0].id || partsResult[0];
  
  const accessoriesResult = await knex('categories').insert({
    name: 'Аксессуары',
    slug: 'accessories',
    description: 'Аксессуары для мотоциклов и мотоциклистов',
    image_url: '/images/categories/accessories.jpg',
    is_active: true
  }).returning('id');
  const accessoriesId = accessoriesResult[0].id || accessoriesResult[0];
  
  // Подкатегории для мотоциклов
  await knex('categories').insert([
    {
      name: 'Спортивные',
      slug: 'sport-bikes',
      description: 'Спортивные мотоциклы для высоких скоростей',
      parent_id: motorcyclesId,
      image_url: '/images/categories/sport-bikes.jpg',
      is_active: true
    },
    {
      name: 'Круизеры',
      slug: 'cruisers',
      description: 'Комфортные мотоциклы для дальних поездок',
      parent_id: motorcyclesId,
      image_url: '/images/categories/cruisers.jpg',
      is_active: true
    },
    {
      name: 'Эндуро',
      slug: 'enduro',
      description: 'Мотоциклы для бездорожья и приключений',
      parent_id: motorcyclesId,
      image_url: '/images/categories/enduro.jpg',
      is_active: true
    }
  ]);
  
  // Подкатегории для экипировки
  await knex('categories').insert([
    {
      name: 'Шлемы',
      slug: 'helmets',
      description: 'Защитные шлемы для мотоциклистов',
      parent_id: gearId,
      image_url: '/images/categories/helmets.jpg',
      is_active: true
    },
    {
      name: 'Куртки',
      slug: 'jackets',
      description: 'Мотоциклетные куртки с защитой',
      parent_id: gearId,
      image_url: '/images/categories/jackets.jpg',
      is_active: true
    },
    {
      name: 'Перчатки',
      slug: 'gloves',
      description: 'Защитные перчатки для мотоциклистов',
      parent_id: gearId,
      image_url: '/images/categories/gloves.jpg',
      is_active: true
    }
  ]);
  
  // Подкатегории для запчастей
  await knex('categories').insert([
    {
      name: 'Двигатель',
      slug: 'engine-parts',
      description: 'Запчасти для двигателя мотоцикла',
      parent_id: partsId,
      image_url: '/images/categories/engine-parts.jpg',
      is_active: true
    },
    {
      name: 'Тормозная система',
      slug: 'brake-system',
      description: 'Компоненты тормозной системы',
      parent_id: partsId,
      image_url: '/images/categories/brake-system.jpg',
      is_active: true
    },
    {
      name: 'Электрика',
      slug: 'electrical',
      description: 'Электрические компоненты для мотоциклов',
      parent_id: partsId,
      image_url: '/images/categories/electrical.jpg',
      is_active: true
    }
  ]);
  
  // Подкатегории для аксессуаров
  await knex('categories').insert([
    {
      name: 'Багаж',
      slug: 'luggage',
      description: 'Системы хранения для мотоциклов',
      parent_id: accessoriesId,
      image_url: '/images/categories/luggage.jpg',
      is_active: true
    },
    {
      name: 'Защита',
      slug: 'protection',
      description: 'Защитные аксессуары для мотоциклов',
      parent_id: accessoriesId,
      image_url: '/images/categories/protection.jpg',
      is_active: true
    },
    {
      name: 'Электроника',
      slug: 'electronics',
      description: 'Электронные аксессуары для мотоциклистов',
      parent_id: accessoriesId,
      image_url: '/images/categories/electronics.jpg',
      is_active: true
    }
  ]);
}
