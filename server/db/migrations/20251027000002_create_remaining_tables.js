/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema
    // Создание таблицы связи товаров и категорий
    .createTable('product_categories', (table) => {
      table.integer('product_id').unsigned().references('id').inTable('products').onDelete('CASCADE');
      table.integer('category_id').unsigned().references('id').inTable('categories').onDelete('CASCADE');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.primary(['product_id', 'category_id']);
    })
    
    // Создание таблицы дополнительных изображений товаров
    .createTable('product_images', (table) => {
      table.increments('id').primary();
      table.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE');
      table.string('image_url', 255).notNullable();
      table.integer('sort_order').defaultTo(0);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    
    // Создание таблицы складских остатков
    .createTable('inventory', (table) => {
      table.increments('id').primary();
      table.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE');
      table.integer('quantity').notNullable().defaultTo(0);
      table.integer('reserved_quantity').notNullable().defaultTo(0);
      table.string('warehouse', 100).defaultTo('main');
      table.timestamp('last_restock_date');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.check('?? >= 0', ['quantity']);
      table.check('?? >= 0', ['reserved_quantity']);
    })
    
    // Создание таблицы заказов
    .createTable('orders', (table) => {
      table.increments('id').primary();
      table.string('order_number', 50).notNullable().unique();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.string('status', 50).notNullable().defaultTo('pending');
      table.decimal('total_amount', 12, 2).notNullable();
      table.text('shipping_address').notNullable();
      table.string('shipping_city', 100).notNullable();
      table.string('shipping_postal_code', 20).notNullable();
      table.string('shipping_country', 100).notNullable().defaultTo('Россия');
      table.string('payment_method', 50).notNullable();
      table.string('payment_status', 50).notNullable().defaultTo('pending');
      table.text('notes');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    
    // Создание таблицы позиций заказа
    .createTable('order_items', (table) => {
      table.increments('id').primary();
      table.integer('order_id').unsigned().notNullable().references('id').inTable('orders').onDelete('CASCADE');
      table.integer('product_id').unsigned().references('id').inTable('products').onDelete('SET NULL');
      table.string('product_name', 255).notNullable();
      table.integer('quantity').notNullable().checkPositive();
      table.decimal('price', 12, 2).notNullable().checkPositive();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    
    // Создание таблицы отзывов
    .createTable('reviews', (table) => {
      table.increments('id').primary();
      table.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE');
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.integer('rating').notNullable();
      table.text('comment');
      table.boolean('is_approved').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.check('?? BETWEEN 1 AND 5', ['rating']);
    })
    
    // Создание таблицы журнала аудита
    .createTable('audit_log', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.string('action', 50).notNullable();
      table.string('table_name', 50).notNullable();
      table.integer('record_id');
      table.jsonb('old_values');
      table.jsonb('new_values');
      table.string('ip_address', 45);
      table.text('user_agent');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema
    .dropTableIfExists('audit_log')
    .dropTableIfExists('reviews')
    .dropTableIfExists('order_items')
    .dropTableIfExists('orders')
    .dropTableIfExists('inventory')
    .dropTableIfExists('product_images')
    .dropTableIfExists('product_categories');
}
