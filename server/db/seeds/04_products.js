/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export async function seed(knex) {
  // Очистка таблиц
  await knex('product_categories').del();
  await knex('product_images').del();
  await knex('inventory').del();
  await knex('products').del();
  
  // Получение ID категорий
  const categories = await knex('categories').select('id', 'slug');
  const getCategoryIdBySlug = (slug) => {
    const category = categories.find(c => c.slug === slug);
    return category ? category.id : null;
  };
  
  // Мотоциклы
  const motorcycles = [
    {
      name: 'Yamaha YZF-R1',
      slug: 'yamaha-yzf-r1',
      sku: 'MOTO-001',
      description: 'Спортивный мотоцикл с мощным двигателем 998 куб.см. Идеален для трека и скоростной езды.',
      price: 1250000,
      old_price: 1350000,
      image_url: '/images/products/yamaha-r1.jpg',
      is_active: true,
      is_featured: true,
      brand: 'Yamaha',
      weight: 200,
      dimensions: '2055x730x1150',
      categories: ['motorcycles', 'sport-bikes']
    },
    {
      name: 'Harley-Davidson Road King',
      slug: 'harley-davidson-road-king',
      sku: 'MOTO-002',
      description: 'Классический круизер для комфортных путешествий на дальние расстояния.',
      price: 1800000,
      old_price: null,
      image_url: '/images/products/harley-road-king.jpg',
      is_active: true,
      is_featured: true,
      brand: 'Harley-Davidson',
      weight: 375,
      dimensions: '2420x960x1385',
      categories: ['motorcycles', 'cruisers']
    },
    {
      name: 'BMW R 1250 GS Adventure',
      slug: 'bmw-r-1250-gs-adventure',
      sku: 'MOTO-003',
      description: 'Туристический эндуро для путешествий по любым дорогам и бездорожью.',
      price: 1650000,
      old_price: 1750000,
      image_url: '/images/products/bmw-gs.jpg',
      is_active: true,
      is_featured: true,
      brand: 'BMW',
      weight: 268,
      dimensions: '2270x980x1460',
      categories: ['motorcycles', 'enduro']
    }
  ];
  
  // Экипировка
  const gear = [
    {
      name: 'Шлем AGV K6',
      slug: 'agv-k6-helmet',
      sku: 'GEAR-001',
      description: 'Легкий спортивный шлем с отличной аэродинамикой и вентиляцией.',
      price: 45000,
      old_price: 48000,
      image_url: '/images/products/agv-k6.jpg',
      is_active: true,
      is_featured: false,
      brand: 'AGV',
      weight: 1.4,
      dimensions: '35x25x25',
      categories: ['gear', 'helmets']
    },
    {
      name: 'Куртка Dainese Super Speed 3',
      slug: 'dainese-super-speed-3',
      sku: 'GEAR-002',
      description: 'Спортивная кожаная куртка с защитными вставками и аэродинамическим горбом.',
      price: 52000,
      old_price: null,
      image_url: '/images/products/dainese-jacket.jpg',
      is_active: true,
      is_featured: false,
      brand: 'Dainese',
      weight: 3.2,
      dimensions: '60x40x10',
      categories: ['gear', 'jackets']
    },
    {
      name: 'Перчатки Alpinestars GP Pro R3',
      slug: 'alpinestars-gp-pro-r3',
      sku: 'GEAR-003',
      description: 'Спортивные перчатки с защитой костяшек и ладони.',
      price: 12000,
      old_price: 15000,
      image_url: '/images/products/alpinestars-gloves.jpg',
      is_active: true,
      is_featured: false,
      brand: 'Alpinestars',
      weight: 0.3,
      dimensions: '25x15x5',
      categories: ['gear', 'gloves']
    }
  ];
  
  // Запчасти
  const parts = [
    {
      name: 'Масляный фильтр HF204',
      slug: 'oil-filter-hf204',
      sku: 'PART-001',
      description: 'Высококачественный масляный фильтр для мотоциклов Honda, Kawasaki, Yamaha.',
      price: 800,
      old_price: null,
      image_url: '/images/products/oil-filter.jpg',
      is_active: true,
      is_featured: false,
      brand: 'HiFlo',
      weight: 0.1,
      dimensions: '10x10x10',
      categories: ['parts', 'engine-parts']
    },
    {
      name: 'Тормозные колодки Brembo 07BB33SA',
      slug: 'brembo-brake-pads-07bb33sa',
      sku: 'PART-002',
      description: 'Спортивные тормозные колодки для мотоциклов с высокими характеристиками.',
      price: 3500,
      old_price: 4000,
      image_url: '/images/products/brembo-pads.jpg',
      is_active: true,
      is_featured: false,
      brand: 'Brembo',
      weight: 0.5,
      dimensions: '15x10x5',
      categories: ['parts', 'brake-system']
    },
    {
      name: 'Аккумулятор Yuasa YTX14-BS',
      slug: 'yuasa-battery-ytx14-bs',
      sku: 'PART-003',
      description: 'Необслуживаемый аккумулятор для мотоциклов.',
      price: 6500,
      old_price: null,
      image_url: '/images/products/yuasa-battery.jpg',
      is_active: true,
      is_featured: false,
      brand: 'Yuasa',
      weight: 4.2,
      dimensions: '15x8x17',
      categories: ['parts', 'electrical']
    }
  ];
  
  // Аксессуары
  const accessories = [
    {
      name: 'Кофр GIVI E52',
      slug: 'givi-e52-top-case',
      sku: 'ACC-001',
      description: 'Вместительный центральный кофр для мотоцикла объемом 52 литра.',
      price: 18000,
      old_price: 20000,
      image_url: '/images/products/givi-case.jpg',
      is_active: true,
      is_featured: false,
      brand: 'GIVI',
      weight: 5.5,
      dimensions: '60x45x30',
      categories: ['accessories', 'luggage']
    },
    {
      name: 'Слайдеры R&G для Honda CBR',
      slug: 'rg-frame-sliders-honda-cbr',
      sku: 'ACC-002',
      description: 'Защитные слайдеры для рамы мотоцикла Honda CBR.',
      price: 5500,
      old_price: null,
      image_url: '/images/products/frame-sliders.jpg',
      is_active: true,
      is_featured: false,
      brand: 'R&G',
      weight: 0.8,
      dimensions: '20x15x10',
      categories: ['accessories', 'protection']
    },
    {
      name: 'Навигатор Garmin Zumo XT',
      slug: 'garmin-zumo-xt',
      sku: 'ACC-003',
      description: 'Мотоциклетный GPS-навигатор с 5.5" дисплеем и защитой от влаги.',
      price: 42000,
      old_price: 45000,
      image_url: '/images/products/garmin-zumo.jpg',
      is_active: true,
      is_featured: false,
      brand: 'Garmin',
      weight: 0.4,
      dimensions: '14x8x2',
      categories: ['accessories', 'electronics']
    }
  ];
  
  // Объединение всех продуктов
  const allProducts = [...motorcycles, ...gear, ...parts, ...accessories];
  
  // Вставка продуктов и связанных данных
  for (const product of allProducts) {
    const { categories: productCategories, ...productData } = product;
    
    // Вставка продукта
    const productResult = await knex('products').insert(productData).returning('id');
    const productId = productResult[0].id || productResult[0];
    
    // Связь с категориями
    for (const categorySlug of productCategories) {
      const categoryId = getCategoryIdBySlug(categorySlug);
      if (categoryId) {
        await knex('product_categories').insert({
          product_id: productId,
          category_id: categoryId
        });
      }
    }
    
    // Добавление складских остатков
    await knex('inventory').insert({
      product_id: productId,
      quantity: Math.floor(Math.random() * 50) + 10,
      reserved_quantity: 0,
      warehouse: 'main',
      last_restock_date: new Date()
    });
    
    // Добавление дополнительных изображений (для примера)
    if (product.slug.includes('yamaha') || product.slug.includes('harley') || product.slug.includes('bmw')) {
      for (let i = 1; i <= 3; i++) {
        await knex('product_images').insert({
          product_id: productId,
          image_url: `/images/products/${product.slug}-${i}.jpg`,
          sort_order: i
        });
      }
    }
  }
}
