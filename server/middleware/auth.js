import jwt from 'jsonwebtoken';
import db from '../db/index.js';

// Middleware для проверки JWT токена
export const authenticateToken = async (req, res, next) => {
  try {
    // Получение токена из заголовка Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Требуется авторизация'
      });
    }
    
    // Проверка токена
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          error: 'Недействительный или просроченный токен'
        });
      }
      
      // Проверка существования пользователя в базе
      const user = await db('users').where({ id: decoded.id }).first();
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Пользователь не найден'
        });
      }
      
      // Проверка активности аккаунта
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          error: 'Аккаунт заблокирован'
        });
      }
      
      // Сохранение данных пользователя в объекте запроса
      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error('Ошибка аутентификации:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при аутентификации'
    });
  }
};

// Middleware для проверки ролей пользователя
export const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Требуется авторизация'
      });
    }
    
    const userRoles = req.user.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: 'Доступ запрещен. Недостаточно прав'
      });
    }
    
    next();
  };
};
