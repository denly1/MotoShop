import db from './db/index.js';

async function checkUsers() {
  try {
    console.log('Проверка таблицы пользователей...');
    
    // Проверка существования таблицы users
    const usersTableExists = await db.schema.hasTable('users');
    console.log(`Таблица users ${usersTableExists ? 'существует' : 'не существует'}`);
    
    if (usersTableExists) {
      // Получение списка пользователей
      const users = await db('users').select('*');
      console.log(`Найдено ${users.length} пользователей:`);
      
      users.forEach((user, index) => {
        console.log(`\nПользователь #${index + 1}:`);
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Имя: ${user.first_name} ${user.last_name}`);
        console.log(`Активен: ${user.is_active ? 'Да' : 'Нет'}`);
        console.log(`Создан: ${user.created_at}`);
      });
      
      // Проверка существования таблицы roles
      const rolesTableExists = await db.schema.hasTable('roles');
      console.log(`\nТаблица roles ${rolesTableExists ? 'существует' : 'не существует'}`);
      
      if (rolesTableExists) {
        // Получение списка ролей
        const roles = await db('roles').select('*');
        console.log(`Найдено ${roles.length} ролей:`);
        
        roles.forEach((role, index) => {
          console.log(`\nРоль #${index + 1}:`);
          console.log(`ID: ${role.id}`);
          console.log(`Название: ${role.name}`);
          console.log(`Описание: ${role.description}`);
        });
        
        // Проверка существования таблицы user_roles
        const userRolesTableExists = await db.schema.hasTable('user_roles');
        console.log(`\nТаблица user_roles ${userRolesTableExists ? 'существует' : 'не существует'}`);
        
        if (userRolesTableExists) {
          // Получение связей пользователей и ролей
          const userRoles = await db('user_roles')
            .join('users', 'user_roles.user_id', 'users.id')
            .join('roles', 'user_roles.role_id', 'roles.id')
            .select('users.email', 'roles.name');
          
          console.log(`\nНайдено ${userRoles.length} связей пользователей и ролей:`);
          
          userRoles.forEach((userRole, index) => {
            console.log(`${index + 1}. ${userRole.email} - ${userRole.name}`);
          });
        }
      }
    }
  } catch (error) {
    console.error('Ошибка при проверке пользователей:', error);
  } finally {
    // Закрытие соединения с базой данных
    db.destroy();
  }
}

checkUsers();
