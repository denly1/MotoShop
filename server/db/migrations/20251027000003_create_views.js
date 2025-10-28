/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema
    // Представление для активных товаров с категориями
    .raw(`
      CREATE VIEW active_products_with_categories AS
      SELECT 
        p.id, p.name, p.slug, p.price, p.image_url, p.is_featured, p.brand,
        c.id as category_id, c.name as category_name, c.slug as category_slug
      FROM products p
      JOIN product_categories pc ON p.id = pc.product_id
      JOIN categories c ON pc.category_id = c.id
      WHERE p.is_active = TRUE AND c.is_active = TRUE;
    `)
    
    // Представление для статистики заказов
    .raw(`
      CREATE VIEW order_statistics AS
      SELECT 
        DATE_TRUNC('day', o.created_at) as order_date,
        COUNT(DISTINCT o.id) as total_orders,
        SUM(o.total_amount) as total_revenue,
        AVG(o.total_amount) as average_order_value,
        COUNT(DISTINCT o.user_id) as unique_customers
      FROM orders o
      GROUP BY DATE_TRUNC('day', o.created_at)
      ORDER BY order_date DESC;
    `)
    
    // Представление для топ-продаваемых товаров
    .raw(`
      CREATE VIEW top_selling_products AS
      SELECT 
        p.id, p.name, p.slug, p.price, p.image_url,
        SUM(oi.quantity) as total_sold,
        COUNT(DISTINCT o.id) as order_count
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY p.id, p.name, p.slug, p.price, p.image_url
      ORDER BY total_sold DESC;
    `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema
    .raw('DROP VIEW IF EXISTS top_selling_products;')
    .raw('DROP VIEW IF EXISTS order_statistics;')
    .raw('DROP VIEW IF EXISTS active_products_with_categories;');
}
