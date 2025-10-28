/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema
    // Процедура для оформления заказа с проверкой наличия товаров
    .raw(`
      CREATE OR REPLACE FUNCTION create_order(
        p_user_id INTEGER,
        p_shipping_address TEXT,
        p_shipping_city VARCHAR(100),
        p_shipping_postal_code VARCHAR(20),
        p_shipping_country VARCHAR(100),
        p_payment_method VARCHAR(50),
        p_notes TEXT,
        p_items JSONB
      )
      RETURNS JSONB
      LANGUAGE plpgsql
      AS $$
      DECLARE
        v_order_id INTEGER;
        v_order_number VARCHAR(50);
        v_total_amount DECIMAL(12, 2) := 0;
        v_item JSONB;
        v_product_id INTEGER;
        v_quantity INTEGER;
        v_price DECIMAL(12, 2);
        v_product_name VARCHAR(255);
        v_available_quantity INTEGER;
        v_insufficient_items JSONB := '[]';
      BEGIN
        -- Генерация номера заказа
        v_order_number := 'MS-' || to_char(now(), 'YYYYMMDD') || '-' || floor(random() * 10000)::TEXT;
        
        -- Проверка наличия товаров на складе
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
          v_product_id := (v_item->>'product_id')::INTEGER;
          v_quantity := (v_item->>'quantity')::INTEGER;
          
          -- Получение доступного количества товара
          SELECT (quantity - reserved_quantity) INTO v_available_quantity
          FROM inventory
          WHERE product_id = v_product_id;
          
          IF v_available_quantity < v_quantity THEN
            v_insufficient_items := v_insufficient_items || jsonb_build_object(
              'product_id', v_product_id,
              'requested', v_quantity,
              'available', v_available_quantity
            );
          END IF;
        END LOOP;
        
        -- Если есть товары с недостаточным количеством, вернуть ошибку
        IF jsonb_array_length(v_insufficient_items) > 0 THEN
          RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'Недостаточное количество товаров на складе',
            'insufficient_items', v_insufficient_items
          );
        END IF;
        
        -- Начало транзакции
        BEGIN
          -- Создание заказа
          INSERT INTO orders (
            order_number,
            user_id,
            status,
            total_amount,
            shipping_address,
            shipping_city,
            shipping_postal_code,
            shipping_country,
            payment_method,
            payment_status,
            notes
          ) VALUES (
            v_order_number,
            p_user_id,
            'pending',
            0, -- Временное значение, будет обновлено позже
            p_shipping_address,
            p_shipping_city,
            p_shipping_postal_code,
            p_shipping_country,
            p_payment_method,
            'pending',
            p_notes
          ) RETURNING id INTO v_order_id;
          
          -- Добавление позиций заказа и обновление складских остатков
          FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
          LOOP
            v_product_id := (v_item->>'product_id')::INTEGER;
            v_quantity := (v_item->>'quantity')::INTEGER;
            
            -- Получение информации о товаре
            SELECT name, price INTO v_product_name, v_price
            FROM products
            WHERE id = v_product_id;
            
            -- Добавление позиции заказа
            INSERT INTO order_items (
              order_id,
              product_id,
              product_name,
              quantity,
              price
            ) VALUES (
              v_order_id,
              v_product_id,
              v_product_name,
              v_quantity,
              v_price
            );
            
            -- Обновление зарезервированного количества товара
            UPDATE inventory
            SET reserved_quantity = reserved_quantity + v_quantity
            WHERE product_id = v_product_id;
            
            -- Обновление общей суммы заказа
            v_total_amount := v_total_amount + (v_price * v_quantity);
          END LOOP;
          
          -- Обновление общей суммы заказа
          UPDATE orders
          SET total_amount = v_total_amount
          WHERE id = v_order_id;
          
          -- Возврат успешного результата
          RETURN jsonb_build_object(
            'success', TRUE,
            'message', 'Заказ успешно создан',
            'order_id', v_order_id,
            'order_number', v_order_number,
            'total_amount', v_total_amount
          );
          
        EXCEPTION WHEN OTHERS THEN
          -- В случае ошибки откатываем транзакцию
          RAISE;
          RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'Ошибка при создании заказа: ' || SQLERRM
          );
        END;
      END;
      $$;
    `)
    
    // Процедура для обновления статуса заказа
    .raw(`
      CREATE OR REPLACE FUNCTION update_order_status(
        p_order_id INTEGER,
        p_status VARCHAR(50),
        p_payment_status VARCHAR(50) DEFAULT NULL
      )
      RETURNS JSONB
      LANGUAGE plpgsql
      AS $$
      DECLARE
        v_old_status VARCHAR(50);
        v_order_exists BOOLEAN;
      BEGIN
        -- Проверка существования заказа
        SELECT EXISTS(SELECT 1 FROM orders WHERE id = p_order_id) INTO v_order_exists;
        
        IF NOT v_order_exists THEN
          RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'Заказ не найден'
          );
        END IF;
        
        -- Получение текущего статуса заказа
        SELECT status INTO v_old_status FROM orders WHERE id = p_order_id;
        
        -- Начало транзакции
        BEGIN
          -- Обновление статуса заказа
          UPDATE orders
          SET 
            status = p_status,
            payment_status = COALESCE(p_payment_status, payment_status),
            updated_at = NOW()
          WHERE id = p_order_id;
          
          -- Обработка изменения статуса
          IF v_old_status != p_status THEN
            -- Если заказ отменен, освободить зарезервированные товары
            IF p_status = 'cancelled' THEN
              UPDATE inventory i
              SET reserved_quantity = reserved_quantity - oi.quantity
              FROM order_items oi
              WHERE oi.order_id = p_order_id
              AND i.product_id = oi.product_id;
            END IF;
            
            -- Если заказ доставлен, списать товары со склада
            IF p_status = 'delivered' THEN
              UPDATE inventory i
              SET 
                quantity = quantity - oi.quantity,
                reserved_quantity = reserved_quantity - oi.quantity
              FROM order_items oi
              WHERE oi.order_id = p_order_id
              AND i.product_id = oi.product_id;
            END IF;
          END IF;
          
          -- Возврат успешного результата
          RETURN jsonb_build_object(
            'success', TRUE,
            'message', 'Статус заказа успешно обновлен',
            'order_id', p_order_id,
            'new_status', p_status,
            'old_status', v_old_status
          );
          
        EXCEPTION WHEN OTHERS THEN
          -- В случае ошибки откатываем транзакцию
          RAISE;
          RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'Ошибка при обновлении статуса заказа: ' || SQLERRM
          );
        END;
      END;
      $$;
    `)
    
    // Функция для расчета статистики продаж за период
    .raw(`
      CREATE OR REPLACE FUNCTION get_sales_statistics(
        p_start_date TIMESTAMP,
        p_end_date TIMESTAMP
      )
      RETURNS JSONB
      LANGUAGE plpgsql
      AS $$
      DECLARE
        v_total_orders INTEGER;
        v_total_revenue DECIMAL(12, 2);
        v_avg_order_value DECIMAL(12, 2);
        v_top_products JSONB;
        v_top_categories JSONB;
      BEGIN
        -- Получение общей статистики
        SELECT 
          COUNT(*),
          COALESCE(SUM(total_amount), 0),
          COALESCE(AVG(total_amount), 0)
        INTO 
          v_total_orders,
          v_total_revenue,
          v_avg_order_value
        FROM orders
        WHERE created_at BETWEEN p_start_date AND p_end_date
        AND status != 'cancelled';
        
        -- Получение топ-5 товаров
        WITH top_products AS (
          SELECT 
            p.id,
            p.name,
            p.image_url,
            SUM(oi.quantity) as total_quantity,
            SUM(oi.quantity * oi.price) as total_revenue
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
          JOIN orders o ON oi.order_id = o.id
          WHERE o.created_at BETWEEN p_start_date AND p_end_date
          AND o.status != 'cancelled'
          GROUP BY p.id, p.name, p.image_url
          ORDER BY total_quantity DESC
          LIMIT 5
        )
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', id,
            'name', name,
            'image_url', image_url,
            'total_quantity', total_quantity,
            'total_revenue', total_revenue
          )
        ) INTO v_top_products
        FROM top_products;
        
        -- Получение топ-5 категорий
        WITH top_categories AS (
          SELECT 
            c.id,
            c.name,
            COUNT(DISTINCT o.id) as order_count,
            SUM(oi.quantity) as total_quantity,
            SUM(oi.quantity * oi.price) as total_revenue
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
          JOIN product_categories pc ON p.id = pc.product_id
          JOIN categories c ON pc.category_id = c.id
          JOIN orders o ON oi.order_id = o.id
          WHERE o.created_at BETWEEN p_start_date AND p_end_date
          AND o.status != 'cancelled'
          GROUP BY c.id, c.name
          ORDER BY total_revenue DESC
          LIMIT 5
        )
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', id,
            'name', name,
            'order_count', order_count,
            'total_quantity', total_quantity,
            'total_revenue', total_revenue
          )
        ) INTO v_top_categories
        FROM top_categories;
        
        -- Возврат результата
        RETURN jsonb_build_object(
          'period', jsonb_build_object(
            'start_date', p_start_date,
            'end_date', p_end_date
          ),
          'summary', jsonb_build_object(
            'total_orders', v_total_orders,
            'total_revenue', v_total_revenue,
            'avg_order_value', v_avg_order_value
          ),
          'top_products', COALESCE(v_top_products, '[]'::jsonb),
          'top_categories', COALESCE(v_top_categories, '[]'::jsonb)
        );
      END;
      $$;
    `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema
    .raw('DROP FUNCTION IF EXISTS get_sales_statistics(TIMESTAMP, TIMESTAMP);')
    .raw('DROP FUNCTION IF EXISTS update_order_status(INTEGER, VARCHAR, VARCHAR);')
    .raw('DROP FUNCTION IF EXISTS create_order(INTEGER, TEXT, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, JSONB);');
}
