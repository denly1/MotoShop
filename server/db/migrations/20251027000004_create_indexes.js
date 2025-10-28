/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema
    // Индексы для таблицы products
    .raw('CREATE INDEX idx_products_is_active ON products(is_active);')
    .raw('CREATE INDEX idx_products_is_featured ON products(is_featured);')
    .raw('CREATE INDEX idx_products_price ON products(price);')
    
    // Индексы для таблицы orders
    .raw('CREATE INDEX idx_orders_status ON orders(status);')
    .raw('CREATE INDEX idx_orders_user_id ON orders(user_id);')
    
    // Индексы для таблицы order_items
    .raw('CREATE INDEX idx_order_items_product_id ON order_items(product_id);')
    
    // Индексы для таблицы inventory
    .raw('CREATE INDEX idx_inventory_product_id ON inventory(product_id);')
    
    // Индексы для таблицы reviews
    .raw('CREATE INDEX idx_reviews_product_id ON reviews(product_id);')
    
    // Индексы для таблицы audit_log
    .raw('CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);')
    .raw('CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema
    .raw('DROP INDEX IF EXISTS idx_products_is_active;')
    .raw('DROP INDEX IF EXISTS idx_products_is_featured;')
    .raw('DROP INDEX IF EXISTS idx_products_price;')
    .raw('DROP INDEX IF EXISTS idx_orders_status;')
    .raw('DROP INDEX IF EXISTS idx_orders_user_id;')
    .raw('DROP INDEX IF EXISTS idx_order_items_product_id;')
    .raw('DROP INDEX IF EXISTS idx_inventory_product_id;')
    .raw('DROP INDEX IF EXISTS idx_reviews_product_id;')
    .raw('DROP INDEX IF EXISTS idx_audit_log_user_id;')
    .raw('DROP INDEX IF EXISTS idx_audit_log_table_name;');
}
