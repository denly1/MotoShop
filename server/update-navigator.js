import { db } from './db/index.js';

const updateNavigator = async () => {
  await db('products')
    .where('name', 'ilike', '%Навигатор%')
    .update({
      image_url: 'https://tse4.mm.bing.net/th/id/OIP.01YRgrurEothDtdlVcTIpQHaHa?rs=1&pid=ImgDetMain'
    });
  
  console.log('✅ Навигатор Garmin обновлен!');
  process.exit(0);
};

updateNavigator();
