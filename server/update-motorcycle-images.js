import { db } from './db/index.js';

const updateMotorcycleImages = async () => {
  try {
    console.log('🏍️ Обновление изображений мотоциклов...\n');

    // Реальные изображения мотоциклов
    const motorcycleImages = [
      {
        search: 'Yamaha YZF-R1',
        imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80'
      },
      {
        search: 'Harley-Davidson',
        imageUrl: 'https://images.unsplash.com/photo-1558980664-3a031cf67ea8?w=800&q=80'
      },
      {
        search: 'BMW R 1250',
        imageUrl: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80'
      },
      {
        search: 'Перчатки',
        imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80'
      },
      {
        search: 'Слайдеры',
        imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80'
      },
      {
        search: 'Навигатор',
        imageUrl: 'https://images.unsplash.com/photo-1551808525-51a94da548ce?w=800&q=80'
      }
    ];

    let updated = 0;

    for (const item of motorcycleImages) {
      const product = await db('products')
        .where('name', 'ilike', `%${item.search}%`)
        .first();

      if (product) {
        await db('products')
          .where({ id: product.id })
          .update({ image_url: item.imageUrl });

        console.log(`✅ ${product.name}`);
        console.log(`   🔗 Изображение обновлено`);
        console.log('');
        updated++;
      }
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ Обновлено мотоциклов: ${updated}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Показываем все товары с изображениями
    const allProducts = await db('products')
      .select('id', 'name', 'brand', 'price', 'image_url')
      .orderBy('id');

    console.log('📋 ВСЕ ТОВАРЫ С ИЗОБРАЖЕНИЯМИ:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    allProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Бренд: ${product.brand || 'Не указан'}`);
      console.log(`   Цена: ${product.price} ₽`);
      console.log(`   🖼️  ${product.image_url ? 'Есть изображение' : 'Нет изображения'}`);
      console.log('');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Все изображения успешно обновлены!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при обновлении изображений:', error);
    process.exit(1);
  }
};

updateMotorcycleImages();
