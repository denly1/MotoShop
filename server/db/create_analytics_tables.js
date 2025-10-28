import db from './index.js';

async function createAnalyticsTables() {
  try {
    console.log('Начало создания таблиц для аналитики...');

    // Проверка существования таблицы orders
    const ordersTableExists = await db.schema.hasTable('orders');
    if (!ordersTableExists) {
      console.log('Таблица orders не существует. Создаем...');
      await db.schema.createTable('orders', table => {
        table.increments('id').primary();
        table.integer('user_id').references('id').inTable('users');
        table.string('order_number', 50).notNullable().unique();
        table.string('status', 50).notNullable().defaultTo('pending');
        table.decimal('total_amount', 10, 2).notNullable();
        table.text('shipping_address').notNullable();
        table.string('shipping_city', 100).notNullable();
        table.string('shipping_postal_code', 20).notNullable();
        table.string('shipping_country', 100).notNullable();
        table.string('payment_method', 50).notNullable();
        table.string('payment_status', 50).notNullable().defaultTo('pending');
        table.text('notes');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
    }

    // Проверка существования таблицы order_items
    const orderItemsTableExists = await db.schema.hasTable('order_items');
    if (!orderItemsTableExists) {
      console.log('Таблица order_items не существует. Создаем...');
      await db.schema.createTable('order_items', table => {
        table.increments('id').primary();
        table.integer('order_id').references('id').inTable('orders').onDelete('CASCADE');
        table.integer('product_id').notNullable();
        table.integer('quantity').notNullable();
        table.decimal('price', 10, 2).notNullable();
        table.timestamp('created_at').defaultTo(db.fn.now());
      });
    }

    // Проверка существования таблицы products
    const productsTableExists = await db.schema.hasTable('products');
    if (!productsTableExists) {
      console.log('Таблица products не существует. Создаем...');
      await db.schema.createTable('products', table => {
        table.increments('id').primary();
        table.string('name', 255).notNullable();
        table.string('slug', 255).notNullable().unique();
        table.string('sku', 50).notNullable().unique();
        table.text('description');
        table.decimal('price', 10, 2).notNullable();
        table.decimal('old_price', 10, 2);
        table.text('image_url');
        table.boolean('is_active').defaultTo(true);
        table.boolean('is_featured').defaultTo(false);
        table.string('brand', 100);
        table.decimal('weight', 10, 2);
        table.string('dimensions', 50);
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
    }

    // Проверка существования таблицы categories
    const categoriesTableExists = await db.schema.hasTable('categories');
    if (!categoriesTableExists) {
      console.log('Таблица categories не существует. Создаем...');
      await db.schema.createTable('categories', table => {
        table.increments('id').primary();
        table.string('name', 100).notNullable();
        table.string('slug', 100).notNullable().unique();
        table.text('description');
        table.integer('parent_id').references('id').inTable('categories');
        table.text('image_url');
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
    }

    // Проверка существования таблицы product_categories
    const productCategoriesTableExists = await db.schema.hasTable('product_categories');
    if (!productCategoriesTableExists) {
      console.log('Таблица product_categories не существует. Создаем...');
      await db.schema.createTable('product_categories', table => {
        table.integer('product_id').references('id').inTable('products').onDelete('CASCADE');
        table.integer('category_id').references('id').inTable('categories').onDelete('CASCADE');
        table.primary(['product_id', 'category_id']);
      });
    }

    // Проверка существования таблицы inventory
    const inventoryTableExists = await db.schema.hasTable('inventory');
    if (!inventoryTableExists) {
      console.log('Таблица inventory не существует. Создаем...');
      await db.schema.createTable('inventory', table => {
        table.integer('product_id').primary().references('id').inTable('products').onDelete('CASCADE');
        table.integer('quantity').notNullable().defaultTo(0);
        table.integer('reserved_quantity').notNullable().defaultTo(0);
        table.string('warehouse', 50).defaultTo('main');
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
    }

    // Создание тестовых данных для аналитики
    // Добавление категорий
    const existingCategories = await db('categories').select('slug');
    const existingCategorySlugs = existingCategories.map(cat => cat.slug);
    
    const categoriesToInsert = [
      { name: 'Мотоциклы', slug: 'motorcycles', description: 'Все виды мотоциклов', is_active: true },
      { name: 'Экипировка', slug: 'gear', description: 'Защитная экипировка для мотоциклистов', is_active: true },
      { name: 'Запчасти', slug: 'parts', description: 'Запасные части для мотоциклов', is_active: true }
    ].filter(cat => !existingCategorySlugs.includes(cat.slug));

    if (categoriesToInsert.length > 0) {
      await db('categories').insert(categoriesToInsert);
      console.log(`Добавлено ${categoriesToInsert.length} категорий`);
    } else {
      console.log('Все категории уже существуют');
    }

    // Добавление товаров
    const existingProducts = await db('products').select('slug');
    const existingProductSlugs = existingProducts.map(prod => prod.slug);
    
    const productsToInsert = [
      { 
        name: 'Yamaha YZF-R1', 
        slug: 'yamaha-yzf-r1', 
        sku: 'MOTO-001', 
        description: 'Спортивный мотоцикл', 
        price: 1250000, 
        image_url: '/images/products/yamaha-r1.jpg', 
        is_active: true, 
        is_featured: true, 
        brand: 'Yamaha' 
      },
      { 
        name: 'Шлем AGV K6', 
        slug: 'agv-k6-helmet', 
        sku: 'GEAR-001', 
        description: 'Спортивный шлем', 
        price: 45000, 
        image_url: '/images/products/agv-k6.jpg', 
        is_active: true, 
        brand: 'AGV' 
      },
      { 
        name: 'Масляный фильтр HF204', 
        slug: 'oil-filter-hf204', 
        sku: 'PART-001', 
        description: 'Масляный фильтр для мотоциклов', 
        price: 800, 
        image_url: '/images/products/oil-filter.jpg', 
        is_active: true, 
        brand: 'HiFlo' 
      }
    ].filter(prod => !existingProductSlugs.includes(prod.slug));

    if (productsToInsert.length > 0) {
      await db('products').insert(productsToInsert);
      console.log(`Добавлено ${productsToInsert.length} товаров`);
    } else {
      console.log('Все товары уже существуют');
    }

    // Связь товаров с категориями
    const products = await db('products')
      .whereIn('slug', ['yamaha-yzf-r1', 'agv-k6-helmet', 'oil-filter-hf204'])
      .select('id', 'slug');
    
    const categories = await db('categories')
      .whereIn('slug', ['motorcycles', 'gear', 'parts'])
      .select('id', 'slug');

    const productCategoriesToInsert = [];
    
    const motorcyclesCategory = categories.find(cat => cat.slug === 'motorcycles');
    const gearCategory = categories.find(cat => cat.slug === 'gear');
    const partsCategory = categories.find(cat => cat.slug === 'parts');
    
    const yamahaProduct = products.find(prod => prod.slug === 'yamaha-yzf-r1');
    const helmetProduct = products.find(prod => prod.slug === 'agv-k6-helmet');
    const filterProduct = products.find(prod => prod.slug === 'oil-filter-hf204');

    if (yamahaProduct && motorcyclesCategory) {
      const existingProductCategory = await db('product_categories')
        .where({ product_id: yamahaProduct.id, category_id: motorcyclesCategory.id })
        .first();
      
      if (!existingProductCategory) {
        productCategoriesToInsert.push({ product_id: yamahaProduct.id, category_id: motorcyclesCategory.id });
      }
    }

    if (helmetProduct && gearCategory) {
      const existingProductCategory = await db('product_categories')
        .where({ product_id: helmetProduct.id, category_id: gearCategory.id })
        .first();
      
      if (!existingProductCategory) {
        productCategoriesToInsert.push({ product_id: helmetProduct.id, category_id: gearCategory.id });
      }
    }

    if (filterProduct && partsCategory) {
      const existingProductCategory = await db('product_categories')
        .where({ product_id: filterProduct.id, category_id: partsCategory.id })
        .first();
      
      if (!existingProductCategory) {
        productCategoriesToInsert.push({ product_id: filterProduct.id, category_id: partsCategory.id });
      }
    }

    if (productCategoriesToInsert.length > 0) {
      await db('product_categories').insert(productCategoriesToInsert);
      console.log(`Добавлено ${productCategoriesToInsert.length} связей товаров и категорий`);
    } else {
      console.log('Все связи товаров и категорий уже существуют');
    }

    // Добавление инвентаря
    const inventoryToInsert = [];
    
    for (const product of products) {
      const existingInventory = await db('inventory')
        .where({ product_id: product.id })
        .first();
      
      if (!existingInventory) {
        inventoryToInsert.push({
          product_id: product.id,
          quantity: 20,
          reserved_quantity: 0,
          warehouse: 'main'
        });
      }
    }

    if (inventoryToInsert.length > 0) {
      await db('inventory').insert(inventoryToInsert);
      console.log(`Добавлено ${inventoryToInsert.length} записей инвентаря`);
    } else {
      console.log('Весь инвентарь уже существует');
    }

    // Добавление тестовых заказов
    const existingOrders = await db('orders').select('order_number');
    const existingOrderNumbers = existingOrders.map(order => order.order_number);
    
    const users = await db('users').select('id');
    
    if (users.length > 0 && !existingOrderNumbers.includes('ORD-2025-001')) {
      // Создание заказа
      const [orderId] = await db('orders').insert({
        user_id: users[0].id,
        order_number: 'ORD-2025-001',
        status: 'completed',
        total_amount: 1250000,
        shipping_address: 'ул. Примерная, д. 1',
        shipping_city: 'Москва',
        shipping_postal_code: '123456',
        shipping_country: 'Россия',
        payment_method: 'card',
        payment_status: 'paid',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 дней назад
      }).returning('id');

      // Добавление товаров в заказ
      if (yamahaProduct) {
        await db('order_items').insert({
          order_id: orderId,
          product_id: yamahaProduct.id,
          quantity: 1,
          price: 1250000
        });
      }

      console.log('Добавлен тестовый заказ');
    } else {
      console.log('Тестовый заказ уже существует или нет пользователей');
    }

    console.log('Таблицы для аналитики успешно созданы и заполнены');
  } catch (error) {
    console.error('Ошибка при создании таблиц для аналитики:', error);
  } finally {
    // Закрытие соединения с базой данных
    db.destroy();
  }
}

createAnalyticsTables();
