/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema
    // Функция для аудита изменений
    .raw(`
      CREATE OR REPLACE FUNCTION audit_trigger_function()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      AS $$
      DECLARE
        v_old_data JSONB;
        v_new_data JSONB;
      BEGIN
        IF (TG_OP = 'UPDATE') THEN
          v_old_data = to_jsonb(OLD);
          v_new_data = to_jsonb(NEW);
          INSERT INTO audit_log (
            user_id,
            action,
            table_name,
            record_id,
            old_values,
            new_values
          ) VALUES (
            current_setting('app.current_user_id', true)::INTEGER,
            TG_OP,
            TG_TABLE_NAME,
            NEW.id,
            v_old_data,
            v_new_data
          );
          RETURN NEW;
        ELSIF (TG_OP = 'DELETE') THEN
          v_old_data = to_jsonb(OLD);
          INSERT INTO audit_log (
            user_id,
            action,
            table_name,
            record_id,
            old_values
          ) VALUES (
            current_setting('app.current_user_id', true)::INTEGER,
            TG_OP,
            TG_TABLE_NAME,
            OLD.id,
            v_old_data
          );
          RETURN OLD;
        ELSIF (TG_OP = 'INSERT') THEN
          v_new_data = to_jsonb(NEW);
          INSERT INTO audit_log (
            user_id,
            action,
            table_name,
            record_id,
            new_values
          ) VALUES (
            current_setting('app.current_user_id', true)::INTEGER,
            TG_OP,
            TG_TABLE_NAME,
            NEW.id,
            v_new_data
          );
          RETURN NEW;
        ELSE
          RETURN NULL;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        -- В случае ошибки, логируем ее, но не блокируем основную операцию
        RAISE WARNING 'Ошибка в audit_trigger_function: %', SQLERRM;
        RETURN COALESCE(NEW, OLD);
      END;
      $$;
    `)
    
    // Триггеры для аудита основных таблиц
    .raw(`
      CREATE TRIGGER products_audit_trigger
      AFTER INSERT OR UPDATE OR DELETE ON products
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
      
      CREATE TRIGGER orders_audit_trigger
      AFTER INSERT OR UPDATE OR DELETE ON orders
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
      
      CREATE TRIGGER users_audit_trigger
      AFTER INSERT OR UPDATE OR DELETE ON users
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
      
      CREATE TRIGGER categories_audit_trigger
      AFTER INSERT OR UPDATE OR DELETE ON categories
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
      
      CREATE TRIGGER inventory_audit_trigger
      AFTER INSERT OR UPDATE OR DELETE ON inventory
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
    `)
    
    // Функция для автоматического обновления updated_at
    .raw(`
      CREATE OR REPLACE FUNCTION update_timestamp_function()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$;
    `)
    
    // Триггеры для обновления timestamp
    .raw(`
      CREATE TRIGGER products_update_timestamp
      BEFORE UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION update_timestamp_function();
      
      CREATE TRIGGER orders_update_timestamp
      BEFORE UPDATE ON orders
      FOR EACH ROW EXECUTE FUNCTION update_timestamp_function();
      
      CREATE TRIGGER users_update_timestamp
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_timestamp_function();
      
      CREATE TRIGGER categories_update_timestamp
      BEFORE UPDATE ON categories
      FOR EACH ROW EXECUTE FUNCTION update_timestamp_function();
      
      CREATE TRIGGER user_settings_update_timestamp
      BEFORE UPDATE ON user_settings
      FOR EACH ROW EXECUTE FUNCTION update_timestamp_function();
      
      CREATE TRIGGER inventory_update_timestamp
      BEFORE UPDATE ON inventory
      FOR EACH ROW EXECUTE FUNCTION update_timestamp_function();
      
      CREATE TRIGGER reviews_update_timestamp
      BEFORE UPDATE ON reviews
      FOR EACH ROW EXECUTE FUNCTION update_timestamp_function();
    `)
    
    // Функция для проверки наличия товара перед добавлением в заказ
    .raw(`
      CREATE OR REPLACE FUNCTION check_inventory_before_insert()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      AS $$
      DECLARE
        v_available_quantity INTEGER;
      BEGIN
        -- Получение доступного количества товара
        SELECT (quantity - reserved_quantity) INTO v_available_quantity
        FROM inventory
        WHERE product_id = NEW.product_id;
        
        IF v_available_quantity < NEW.quantity THEN
          RAISE EXCEPTION 'Недостаточное количество товара (ID: %) на складе. Доступно: %, запрошено: %',
            NEW.product_id, v_available_quantity, NEW.quantity;
        END IF;
        
        RETURN NEW;
      END;
      $$;
    `)
    
    // Триггер для проверки наличия товара
    .raw(`
      CREATE TRIGGER order_items_check_inventory
      BEFORE INSERT ON order_items
      FOR EACH ROW EXECUTE FUNCTION check_inventory_before_insert();
    `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema
    // Удаление триггеров проверки наличия товара
    .raw('DROP TRIGGER IF EXISTS order_items_check_inventory ON order_items;')
    .raw('DROP FUNCTION IF EXISTS check_inventory_before_insert();')
    
    // Удаление триггеров обновления timestamp
    .raw('DROP TRIGGER IF EXISTS products_update_timestamp ON products;')
    .raw('DROP TRIGGER IF EXISTS orders_update_timestamp ON orders;')
    .raw('DROP TRIGGER IF EXISTS users_update_timestamp ON users;')
    .raw('DROP TRIGGER IF EXISTS categories_update_timestamp ON categories;')
    .raw('DROP TRIGGER IF EXISTS user_settings_update_timestamp ON user_settings;')
    .raw('DROP TRIGGER IF EXISTS inventory_update_timestamp ON inventory;')
    .raw('DROP TRIGGER IF EXISTS reviews_update_timestamp ON reviews;')
    .raw('DROP FUNCTION IF EXISTS update_timestamp_function();')
    
    // Удаление триггеров аудита
    .raw('DROP TRIGGER IF EXISTS products_audit_trigger ON products;')
    .raw('DROP TRIGGER IF EXISTS orders_audit_trigger ON orders;')
    .raw('DROP TRIGGER IF EXISTS users_audit_trigger ON users;')
    .raw('DROP TRIGGER IF EXISTS categories_audit_trigger ON categories;')
    .raw('DROP TRIGGER IF EXISTS inventory_audit_trigger ON inventory;')
    .raw('DROP FUNCTION IF EXISTS audit_trigger_function();');
}
