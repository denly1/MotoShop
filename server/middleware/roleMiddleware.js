/**
 * Middleware для проверки ролей пользователя
 * @param {Array} allowedRoles - Массив разрешенных ролей
 * @returns {Function} Middleware функция
 */
export const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // Проверяем, что пользователь аутентифицирован
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Требуется авторизация'
      });
    }

    // Проверяем, что у пользователя есть хотя бы одна из разрешенных ролей
    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещен. Недостаточно прав.'
      });
    }

    // Если все проверки пройдены, продолжаем выполнение запроса
    next();
  };
};

/**
 * Объект с определениями прав для разных ролей
 */
export const permissions = {
  admin: {
    products: ['create', 'read', 'update', 'delete'],
    categories: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
    orders: ['read', 'update', 'delete'],
    analytics: ['read'],
    settings: ['read', 'update']
  },
  manager: {
    products: ['create', 'read', 'update'],
    categories: ['create', 'read', 'update'],
    orders: ['read', 'update'],
    analytics: ['read'],
    settings: ['read']
  },
  customer: {
    products: ['read'],
    categories: ['read'],
    orders: ['create', 'read'],
    profile: ['read', 'update']
  },
  guest: {
    products: ['read'],
    categories: ['read']
  }
};

/**
 * Проверяет, имеет ли пользователь право на выполнение действия
 * @param {Object} user - Объект пользователя
 * @param {string} resource - Ресурс (products, categories, etc.)
 * @param {string} action - Действие (create, read, update, delete)
 * @returns {boolean} Имеет ли пользователь право
 */
export const hasPermission = (user, resource, action) => {
  if (!user || !user.roles) return false;
  
  return user.roles.some(role => {
    const rolePermissions = permissions[role];
    return rolePermissions && 
           rolePermissions[resource] && 
           rolePermissions[resource].includes(action);
  });
};

/**
 * Middleware для проверки прав на выполнение действия
 * @param {string} resource - Ресурс (products, categories, etc.)
 * @param {string} action - Действие (create, read, update, delete)
 * @returns {Function} Middleware функция
 */
export const checkPermission = (resource, action) => {
  return (req, res, next) => {
    // Проверяем, что пользователь аутентифицирован
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Требуется авторизация'
      });
    }

    // Проверяем права пользователя
    if (!hasPermission(req.user, resource, action)) {
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещен. Недостаточно прав.'
      });
    }

    // Если все проверки пройдены, продолжаем выполнение запроса
    next();
  };
};
