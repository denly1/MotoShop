import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Middleware для проверки аутентификации
 */
export const authenticateToken = async (req, res, next) => {
  // Получение токена из заголовка Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Требуется авторизация'
    });
  }
  
  try {
    // Проверка JWT токена
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Сохранение данных пользователя в объекте запроса
    req.user = {
      id: decoded.id,
      email: decoded.email,
      roles: decoded.roles || []
    };
    
    console.log('✅ Токен проверен для пользователя:', req.user.email, 'с ролями:', req.user.roles);
    
    next();
  } catch (error) {
    console.error('❌ Ошибка при проверке токена:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Токен истек'
      });
    }
    
    return res.status(403).json({ 
      success: false,
      error: 'Недействительный токен'
    });
  }
};
