import db from './db/index.js';

async function checkUserSettings() {
  try {
    console.log('Проверка таблицы настроек пользователей...');
    
    // Проверка существования таблицы user_settings
    const userSettingsTableExists = await db.schema.hasTable('user_settings');
    console.log(`Таблица user_settings ${userSettingsTableExists ? 'существует' : 'не существует'}`);
    
    if (userSettingsTableExists) {
      // Получение настроек пользователей
      const userSettings = await db('user_settings')
        .join('users', 'user_settings.user_id', 'users.id')
        .select('users.email', 'user_settings.*');
      
      console.log(`Найдено ${userSettings.length} записей настроек пользователей:`);
      
      userSettings.forEach((settings, index) => {
        console.log(`\nНастройки пользователя #${index + 1}:`);
        console.log(`Email: ${settings.email}`);
        console.log(`Тема: ${settings.theme}`);
        console.log(`Формат даты: ${settings.date_format}`);
        console.log(`Элементов на странице: ${settings.items_per_page}`);
        console.log(`Язык: ${settings.preferred_language}`);
        console.log(`Уведомления: ${settings.notification_enabled ? 'Включены' : 'Выключены'}`);
      });
    }
    
    // Если таблица не существует, создаем ее
    if (!userSettingsTableExists) {
      console.log('Создание таблицы user_settings...');
      
      await db.schema.createTable('user_settings', table => {
        table.integer('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
        table.string('theme', 50).defaultTo('light');
        table.string('date_format', 20).defaultTo('DD.MM.YYYY');
        table.integer('items_per_page').defaultTo(10);
        table.string('preferred_language', 10).defaultTo('ru');
        table.boolean('notification_enabled').defaultTo(true);
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
      
      console.log('Таблица user_settings создана');
      
      // Получение пользователей
      const users = await db('users').select('id');
      
      // Создание настроек для каждого пользователя
      const userSettingsToInsert = users.map(user => ({
        user_id: user.id,
        theme: 'light',
        date_format: 'DD.MM.YYYY',
        items_per_page: 10,
        preferred_language: 'ru',
        notification_enabled: true
      }));
      
      await db('user_settings').insert(userSettingsToInsert);
      console.log(`Добавлены настройки для ${userSettingsToInsert.length} пользователей`);
    }
  } catch (error) {
    console.error('Ошибка при проверке настроек пользователей:', error);
  } finally {
    // Закрытие соединения с базой данных
    db.destroy();
  }
}

checkUserSettings();
