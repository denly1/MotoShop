-- Функция для создания заказа
CREATE OR REPLACE FUNCTION create_order(
    p_user_id INTEGER,
    p_shipping_address TEXT,
    p_shipping_city VARCHAR(100),
    p_shipping_postal_code VARCHAR(20),
    p_shipping_country VARCHAR(100),
    p_payment_method VARCHAR(50),
    p_notes TEXT,
    p_order_items JSONB
) RETURNS JSONB AS $$
DECLARE
    v_order_id INTEGER;
    v_order_number VARCHAR(50);
    v_total_amount DECIMAL(12, 2) := 0;
    v_item JSONB;
    v_product_id INTEGER;
    v_quantity INTEGER;
    v_price DECIMAL(12, 2);
    v_product_name VARCHAR(255);
    v_insufficient_items JSONB := '[]';
    v_inventory RECORD;
BEGIN
    -- Генерация номера заказа (текущая дата + случайное число)
    v_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Проверка наличия товаров на складе
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_items)
    LOOP
        v_product_id := (v_item->>'product_id')::INTEGER;
        v_quantity := (v_item->>'quantity')::INTEGER;
        
        -- Получение информации о товаре и складских остатках
        SELECT i.quantity - i.reserved_quantity AS available, p.price, p.name
        INTO v_inventory
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        WHERE i.product_id = v_product_id;
        
        IF v_inventory.available IS NULL OR v_inventory.available < v_quantity THEN
            v_insufficient_items := v_insufficient_items || jsonb_build_object(
                'product_id', v_product_id,
                'requested', v_quantity,
                'available', COALESCE(v_inventory.available, 0)
            );
        ELSE
            -- Увеличиваем общую сумму заказа
            v_total_amount := v_total_amount + (v_inventory.price * v_quantity);
        END IF;
    END LOOP;
    
    -- Если есть товары с недостаточным количеством, возвращаем ошибку
    IF jsonb_array_length(v_insufficient_items) > 0 THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'Недостаточно товаров на складе',
            'insufficient_items', v_insufficient_items
        );
    END IF;
    
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
        v_total_amount,
        p_shipping_address,
        p_shipping_city,
        p_shipping_postal_code,
        p_shipping_country,
        p_payment_method,
        'pending',
        p_notes
    ) RETURNING id INTO v_order_id;
    
    -- Добавление позиций заказа и обновление складских остатков
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_items)
    LOOP
        v_product_id := (v_item->>'product_id')::INTEGER;
        v_quantity := (v_item->>'quantity')::INTEGER;
        
        -- Получение информации о товаре
        SELECT price, name INTO v_price, v_product_name
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
        
        -- Обновление складских остатков
        UPDATE inventory
        SET reserved_quantity = reserved_quantity + v_quantity
        WHERE product_id = v_product_id;
    END LOOP;
    
    -- Запись в аудит
    INSERT INTO audit_log (
        user_id,
        action,
        table_name,
        record_id,
        new_values
    ) VALUES (
        p_user_id,
        'create',
        'orders',
        v_order_id,
        jsonb_build_object(
            'order_number', v_order_number,
            'total_amount', v_total_amount,
            'status', 'pending'
        )
    );
    
    -- Возвращаем успешный результат
    RETURN jsonb_build_object(
        'success', TRUE,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'total_amount', v_total_amount
    );
END;
$$ LANGUAGE plpgsql;

-- Функция для обновления статуса заказа
CREATE OR REPLACE FUNCTION update_order_status(
    p_order_id INTEGER,
    p_status VARCHAR(50),
    p_payment_status VARCHAR(50) DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_old_status VARCHAR(50);
    v_old_payment_status VARCHAR(50);
    v_order RECORD;
BEGIN
    -- Получение текущего статуса заказа
    SELECT status, payment_status INTO v_old_status, v_old_payment_status
    FROM orders
    WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'Заказ не найден'
        );
    END IF;
    
    -- Обновление статуса заказа
    UPDATE orders
    SET 
        status = p_status,
        payment_status = COALESCE(p_payment_status, payment_status),
        updated_at = NOW()
    WHERE id = p_order_id;
    
    -- Если заказ отменен, возвращаем зарезервированные товары на склад
    IF p_status = 'cancelled' AND v_old_status != 'cancelled' THEN
        UPDATE inventory i
        SET reserved_quantity = i.reserved_quantity - oi.quantity
        FROM order_items oi
        WHERE oi.order_id = p_order_id AND i.product_id = oi.product_id;
    END IF;
    
    -- Если заказ доставлен, уменьшаем количество товаров на складе
    IF p_status = 'delivered' AND v_old_status != 'delivered' THEN
        UPDATE inventory i
        SET 
            quantity = i.quantity - oi.quantity,
            reserved_quantity = i.reserved_quantity - oi.quantity
        FROM order_items oi
        WHERE oi.order_id = p_order_id AND i.product_id = oi.product_id;
    END IF;
    
    -- Запись в аудит
    INSERT INTO audit_log (
        action,
        table_name,
        record_id,
        old_values,
        new_values
    ) VALUES (
        'update',
        'orders',
        p_order_id,
        jsonb_build_object(
            'status', v_old_status,
            'payment_status', v_old_payment_status
        ),
        jsonb_build_object(
            'status', p_status,
            'payment_status', COALESCE(p_payment_status, v_old_payment_status)
        )
    );
    
    -- Возвращаем успешный результат
    RETURN jsonb_build_object(
        'success', TRUE,
        'old_status', v_old_status,
        'new_status', p_status,
        'old_payment_status', v_old_payment_status,
        'new_payment_status', COALESCE(p_payment_status, v_old_payment_status)
    );
END;
$$ LANGUAGE plpgsql;
