/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema
    // Создание таблицы ролей
    .createTable('roles', (table) => {
      table.increments('id').primary();
      table.string('name', 50).notNullable().unique();
      table.text('description');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    
    // Создание таблицы пользователей
    .createTable('users', (table) => {
      table.increments('id').primary();
      table.string('email', 255).notNullable().unique();
      table.string('password_hash', 255).notNullable();
      table.string('first_name', 100).notNullable();
      table.string('last_name', 100).notNullable();
      table.string('phone', 20);
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    
    // Создание таблицы связи пользователей и ролей
    .createTable('user_roles', (table) => {
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('CASCADE');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.primary(['user_id', 'role_id']);
    })
    
    // Создание таблицы настроек пользователей
    .createTable('user_settings', (table) => {
      table.integer('user_id').unsigned().primary().references('id').inTable('users').onDelete('CASCADE');
      table.string('theme', 50).defaultTo('light');
      table.string('date_format', 20).defaultTo('DD.MM.YYYY');
      table.integer('items_per_page').defaultTo(10);
      table.string('preferred_language', 10).defaultTo('ru');
      table.boolean('notification_enabled').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    
    // Создание таблицы категорий
    .createTable('categories', (table) => {
      table.increments('id').primary();
      table.string('name', 100).notNullable();
      table.string('slug', 100).notNullable().unique();
      table.text('description');
      table.integer('parent_id').unsigned().references('id').inTable('categories').onDelete('SET NULL');
      table.string('image_url', 255);
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    
    // Создание таблицы товаров
    .createTable('products', (table) => {
      table.increments('id').primary();
      table.string('name', 255).notNullable();
      table.string('slug', 255).notNullable().unique();
      table.string('sku', 50).unique();
      table.text('description');
      table.decimal('price', 12, 2).notNullable().checkPositive();
      table.decimal('old_price', 12, 2).checkPositive();
      table.string('image_url', 255);
      table.boolean('is_active').defaultTo(true);
      table.boolean('is_featured').defaultTo(false);
      table.string('brand', 100);
      table.decimal('weight', 10, 2);
      table.string('dimensions', 50);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema
    .dropTableIfExists('products')
    .dropTableIfExists('categories')
    .dropTableIfExists('user_settings')
    .dropTableIfExists('user_roles')
    .dropTableIfExists('users')
    .dropTableIfExists('roles');
}
