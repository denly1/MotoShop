// Функции для работы с аутентификацией

// Сохранение пользователя в localStorage
export const saveUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

// Получение пользователя из localStorage
export const getUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Ошибка при парсинге пользователя из localStorage:', error);
    return null;
  }
};

// Удаление пользователя из localStorage
export const removeUser = () => {
  localStorage.removeItem('user');
};

// Проверка, авторизован ли пользователь
export const isAuthenticated = () => {
  return !!getUser();
};

// Проверка, имеет ли пользователь указанную роль
export const hasRole = (role) => {
  const user = getUser();
  if (!user || !user.roles) return false;
  
  return user.roles.includes(role);
};

// Проверка, является ли пользователь администратором
export const isAdmin = () => {
  return hasRole('admin');
};

// Проверка, является ли пользователь менеджером
export const isManager = () => {
  return hasRole('manager');
};

// Проверка, является ли пользователь клиентом
export const isCustomer = () => {
  return hasRole('customer');
};

export default {
  saveUser,
  getUser,
  removeUser,
  isAuthenticated,
  hasRole,
  isAdmin,
  isManager,
  isCustomer
};
