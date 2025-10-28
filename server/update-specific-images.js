import { db } from './db/index.js';

const updateSpecificImages = async () => {
  try {
    console.log('📸 Обновление изображений конкретных товаров...\n');

    // Маппинг товаров и их изображений
    const productImages = [
      {
        search: 'Куртка Dainese',
        imageUrl: 'https://tse1.mm.bing.net/th/id/OIP.6cQSHnQjRn_guRNLtptT2AHaHa?rs=1&pid=ImgDetMain'
      },
      {
        search: 'Кофр',
        imageUrl: 'https://th.bing.com/th/id/OIP.uKfvN8-SJnrskfcRd-d9lwHaHa?rs=1&pid=ImgDetMain'
      },
      {
        search: 'Масляный фильтр',
        imageUrl: 'https://tse4.mm.bing.net/th/id/OIP.QaDE5m5yTPIuyZHwn1xF_gHaEu?rs=1&pid=ImgDetMain'
      },
      {
        search: 'Тормозные колодки',
        imageUrl: 'https://tse1.mm.bing.net/th/id/OIP.uW_DwmNPHwodlWdgdI3jcQHaDR?rs=1&pid=ImgDetMain'
      },
      {
        search: 'Шлем AGV',
        imageUrl: 'https://tse2.mm.bing.net/th/id/OIP.a9BJh8bHGnYiDN7mA24n2gHaJU?rs=1&pid=ImgDetMain'
      },
      {
        search: 'Аккумулятор',
        imageUrl: 'https://th.bing.com/th/id/OIP.HoCS8nGujkqyj_CDbFMNdAHaHa?rs=1&pid=ImgDetMain'
      }
    ];

    let updated = 0;

    for (const item of productImages) {
      // Ищем товар по названию
      const product = await db('products')
        .where('name', 'ilike', `%${item.search}%`)
        .first();

      if (product) {
        // Обновляем изображение
        await db('products')
          .where({ id: product.id })
          .update({ image_url: item.imageUrl });

        console.log(`✅ ${product.name}`);
        console.log(`   🔗 ${item.imageUrl}`);
        console.log('');
        updated++;
      } else {
        console.log(`⚠️  Товар не найден: ${item.search}`);
        console.log('');
      }
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ Обновлено товаров: ${updated} из ${productImages.length}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Показываем обновленные товары
    console.log('📋 Обновленные товары:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    for (const item of productImages) {
      const product = await db('products')
        .where('name', 'ilike', `%${item.search}%`)
        .select('id', 'name', 'image_url')
        .first();
      
      if (product) {
        console.log(`\n${product.name}`);
        console.log(`ID: ${product.id}`);
        console.log(`Изображение: ${product.image_url}`);
      }
    }
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при обновлении изображений:', error);
    process.exit(1);
  }
};

updateSpecificImages();
