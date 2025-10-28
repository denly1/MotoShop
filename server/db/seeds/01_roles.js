/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export async function seed(knex) {
  // Очистка таблицы ролей
  await knex('roles').del();
  
  // Вставка начальных ролей
  await knex('roles').insert([
    {
      name: 'admin',
      description: 'Администратор системы с полным доступом ко всем функциям'
    },
    {
      name: 'manager',
      description: 'Менеджер с доступом к управлению товарами и заказами'
    },
    {
      name: 'customer',
      description: 'Зарегистрированный покупатель'
    },
    {
      name: 'guest',
      description: 'Гость с ограниченным доступом'
    }
  ]);
}
