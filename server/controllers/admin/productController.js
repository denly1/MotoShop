import { validationResult } from 'express-validator';
import db from '../../db/index.js';

/**
 * Получение списка всех товаров для админ-панели
 */
export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'id',
      order = 'asc',
      search,
      category
    } = req.query;

    // Базовый запрос
    let query = db('products');

    // Поиск по названию или описанию
    if (search) {
      query = query.where(function() {
        this.where('name', 'ilike', `%${search}%`)
            .orWhere('description', 'ilike', `%${search}%`)
            .orWhere('sku', 'ilike', `%${search}%`);
      });
    }

    // Фильтрация по категории
    if (category) {
      query = query
        .join('product_categories', 'products.id', 'product_categories.product_id')
        .where('product_categories.category_id', category);
    }

    // Подсчет общего количества товаров
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count();

    // Получение товаров с пагинацией и сортировкой
    const products = await query
      .select('*')
      .orderBy(sort, order)
      .offset((page - 1) * limit)
      .limit(limit);

    // Получение категорий для каждого товара
    const productsWithCategories = await Promise.all(products.map(async (product) => {
      const categories = await db('categories')
        .join('product_categories', 'categories.id', 'product_categories.category_id')
        .where('product_categories.product_id', product.id)
        .select('categories.id', 'categories.name');

      // Получение складских остатков
      const inventory = await db('inventory')
        .where('product_id', product.id)
        .first();

      return {
        ...product,
        categories,
        inventory: inventory || { quantity: 0, reserved_quantity: 0 }
      };
    }));

    res.json({
      success: true,
      products: productsWithCategories,
      pagination: {
        total: parseInt(count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка при получении товаров:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении товаров',
      error: error.message
    });
  }
};

/**
 * Создание нового товара
 */
export const createProduct = async (req, res) => {
  try {
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const {
      name,
      slug,
      sku,
      description,
      price,
      oldPrice,
      imageUrl,
      isActive,
      isFeatured,
      brand,
      weight,
      dimensions,
      categoryIds,
      quantity
    } = req.body;

    // Проверка уникальности slug
    const existingProduct = await db('products').where({ slug }).first();
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Товар с таким slug уже существует'
      });
    }

    // Транзакция для создания товара и связанных данных
    await db.transaction(async trx => {
      // Создание товара
      const [productId] = await trx('products').insert({
        name,
        slug,
        sku: sku || null,
        description: description || null,
        price,
        old_price: oldPrice || null,
        image_url: imageUrl || null,
        is_active: isActive !== undefined ? isActive : true,
        is_featured: isFeatured !== undefined ? isFeatured : false,
        brand: brand || null,
        weight: weight || null,
        dimensions: dimensions || null
      }).returning('id');

      // Связь с категориями
      if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
        const categoryLinks = categoryIds.map(categoryId => ({
          product_id: productId,
          category_id: categoryId
        }));
        
        await trx('product_categories').insert(categoryLinks);
      }

      // Создание записи в инвентаре
      await trx('inventory').insert({
        product_id: productId,
        quantity: quantity || 0,
        reserved_quantity: 0,
        warehouse: 'main',
        last_restock_date: trx.fn.now()
      });

      // Запись в аудит
      await trx('audit_log').insert({
        user_id: req.user.id,
        action: 'create',
        table_name: 'products',
        record_id: productId,
        new_values: JSON.stringify({
          name,
          slug,
          price,
          is_active: isActive !== undefined ? isActive : true
        }),
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
    });

    res.status(201).json({
      success: true,
      message: 'Товар успешно создан'
    });
  } catch (error) {
    console.error('Ошибка при создании товара:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при создании товара',
      error: error.message
    });
  }
};

/**
 * Обновление товара
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      sku,
      description,
      price,
      oldPrice,
      imageUrl,
      isActive,
      isFeatured,
      brand,
      weight,
      dimensions,
      categoryIds
    } = req.body;

    // Проверка существования товара
    const product = await db('products').where({ id }).first();
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Товар не найден'
      });
    }

    // Проверка уникальности slug, если он изменился
    if (slug && slug !== product.slug) {
      const existingProduct = await db('products').where({ slug }).first();
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Товар с таким slug уже существует'
        });
      }
    }

    // Транзакция для обновления товара и связанных данных
    await db.transaction(async trx => {
      // Обновление товара
      await trx('products')
        .where({ id })
        .update({
          name: name || product.name,
          slug: slug || product.slug,
          sku: sku !== undefined ? sku : product.sku,
          description: description !== undefined ? description : product.description,
          price: price || product.price,
          old_price: oldPrice !== undefined ? oldPrice : product.old_price,
          image_url: imageUrl !== undefined ? imageUrl : product.image_url,
          is_active: isActive !== undefined ? isActive : product.is_active,
          is_featured: isFeatured !== undefined ? isFeatured : product.is_featured,
          brand: brand !== undefined ? brand : product.brand,
          weight: weight !== undefined ? weight : product.weight,
          dimensions: dimensions !== undefined ? dimensions : product.dimensions,
          updated_at: trx.fn.now()
        });

      // Обновление связей с категориями, если они предоставлены
      if (categoryIds && Array.isArray(categoryIds)) {
        // Удаление существующих связей
        await trx('product_categories').where({ product_id: id }).del();
        
        // Добавление новых связей
        if (categoryIds.length > 0) {
          const categoryLinks = categoryIds.map(categoryId => ({
            product_id: id,
            category_id: categoryId
          }));
          
          await trx('product_categories').insert(categoryLinks);
        }
      }

      // Запись в аудит
      await trx('audit_log').insert({
        user_id: req.user.id,
        action: 'update',
        table_name: 'products',
        record_id: id,
        old_values: JSON.stringify({
          name: product.name,
          slug: product.slug,
          price: product.price,
          is_active: product.is_active
        }),
        new_values: JSON.stringify({
          name: name || product.name,
          slug: slug || product.slug,
          price: price || product.price,
          is_active: isActive !== undefined ? isActive : product.is_active
        }),
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
    });

    res.json({
      success: true,
      message: 'Товар успешно обновлен'
    });
  } catch (error) {
    console.error('Ошибка при обновлении товара:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении товара',
      error: error.message
    });
  }
};

/**
 * Удаление товара
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Проверка существования товара
    const product = await db('products').where({ id }).first();
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Товар не найден'
      });
    }

    // Проверка наличия товара в заказах
    const orderItems = await db('order_items').where({ product_id: id }).first();
    if (orderItems) {
      // Вместо удаления, деактивируем товар
      await db('products')
        .where({ id })
        .update({
          is_active: false,
          updated_at: db.fn.now()
        });

      // Запись в аудит
      await db('audit_log').insert({
        user_id: req.user.id,
        action: 'deactivate',
        table_name: 'products',
        record_id: id,
        old_values: JSON.stringify({ is_active: product.is_active }),
        new_values: JSON.stringify({ is_active: false }),
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      return res.json({
        success: true,
        message: 'Товар деактивирован, так как он используется в заказах'
      });
    }

    // Транзакция для удаления товара и связанных данных
    await db.transaction(async trx => {
      // Удаление связей с категориями
      await trx('product_categories').where({ product_id: id }).del();
      
      // Удаление дополнительных изображений
      await trx('product_images').where({ product_id: id }).del();
      
      // Удаление из инвентаря
      await trx('inventory').where({ product_id: id }).del();
      
      // Удаление отзывов
      await trx('reviews').where({ product_id: id }).del();
      
      // Удаление товара
      await trx('products').where({ id }).del();

      // Запись в аудит
      await trx('audit_log').insert({
        user_id: req.user.id,
        action: 'delete',
        table_name: 'products',
        record_id: id,
        old_values: JSON.stringify({
          name: product.name,
          slug: product.slug,
          price: product.price
        }),
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
    });

    res.json({
      success: true,
      message: 'Товар успешно удален'
    });
  } catch (error) {
    console.error('Ошибка при удалении товара:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении товара',
      error: error.message
    });
  }
};

/**
 * Обновление складских остатков
 */
export const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    // Проверка существования товара
    const product = await db('products').where({ id }).first();
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Товар не найден'
      });
    }

    // Получение текущих складских остатков
    const inventory = await db('inventory').where({ product_id: id }).first();
    
    if (inventory) {
      // Обновление существующей записи
      await db('inventory')
        .where({ product_id: id })
        .update({
          quantity,
          last_restock_date: db.fn.now(),
          updated_at: db.fn.now()
        });
    } else {
      // Создание новой записи
      await db('inventory').insert({
        product_id: id,
        quantity,
        reserved_quantity: 0,
        warehouse: 'main',
        last_restock_date: db.fn.now()
      });
    }

    // Запись в аудит
    await db('audit_log').insert({
      user_id: req.user.id,
      action: 'update',
      table_name: 'inventory',
      record_id: inventory ? inventory.id : null,
      old_values: inventory ? JSON.stringify({ quantity: inventory.quantity }) : null,
      new_values: JSON.stringify({ quantity }),
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'Складские остатки успешно обновлены'
    });
  } catch (error) {
    console.error('Ошибка при обновлении складских остатков:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении складских остатков',
      error: error.message
    });
  }
};
