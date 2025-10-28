import { db } from './db/index.js';

const addProductImages = async () => {
  try {
    console.log('📸 Добавление изображений к товарам...\n');

    // Красивые изображения мотоциклов с Unsplash
    const motorcycleImages = [
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800', // Спортбайк красный
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800', // Черный мотоцикл
      'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800', // Yamaha синий
      'https://images.unsplash.com/photo-1591608971362-f08b2a75731a?w=800', // Ducati красный
      'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800', // Kawasaki зеленый
      'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800', // Harley Davidson
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800', // BMW черный
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800', // Honda красный
      'https://images.unsplash.com/photo-1609630875123-8e102d73de3d?w=800', // Suzuki синий
      'https://images.unsplash.com/photo-1558980664-3a031cf67ea8?w=800', // KTM оранжевый
      'https://images.unsplash.com/photo-1558980664-1db506751c6c?w=800', // Triumph черный
      'https://images.unsplash.com/photo-1558980664-233d6e6e7d14?w=800', // Aprilia красный
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800', // MV Agusta
      'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800', // Benelli
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800', // Indian
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800', // Victory
      'https://images.unsplash.com/photo-1591608971362-f08b2a75731a?w=800', // Can-Am
      'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800', // Polaris
      'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800', // Royal Enfield
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800', // Husqvarna
    ];

    // Получаем все товары
    const products = await db('products').select('id', 'name', 'brand');
    
    console.log(`📦 Найдено товаров: ${products.length}\n`);

    let updated = 0;
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const imageUrl = motorcycleImages[i % motorcycleImages.length];
      
      await db('products')
        .where({ id: product.id })
        .update({ image_url: imageUrl });
      
      console.log(`✅ ${i + 1}. ${product.name} - изображение добавлено`);
      updated++;
    }

    console.log(`\n✅ Обновлено товаров: ${updated}`);
    console.log('📸 Все изображения успешно добавлены!\n');

    // Показываем примеры
    const samplesWithImages = await db('products')
      .select('id', 'name', 'brand', 'image_url')
      .limit(5);
    
    console.log('📋 Примеры товаров с изображениями:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    samplesWithImages.forEach(p => {
      console.log(`${p.name}`);
      console.log(`🔗 ${p.image_url}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при добавлении изображений:', error);
    process.exit(1);
  }
};

addProductImages();
