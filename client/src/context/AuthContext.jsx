import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Проверка пользователя в localStorage
  const checkAuth = useCallback(() => {
    console.log('Проверка аутентификации пользователя');
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userStr || !token) {
      console.log('Пользователь или токен не найдены в localStorage');
      setIsAuthenticated(false);
      setUser(null);
      return;
    }
    
    try {
      const userData = JSON.parse(userStr);
      
      // Проверка наличия необходимых полей
      if (!userData || !userData.id || !userData.email || !userData.roles || !Array.isArray(userData.roles)) {
        console.error('Некорректные данные пользователя в localStorage');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
        return;
      }
      
      // Установка токена по умолчанию для axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log('Пользователь аутентифицирован:', userData.email, 'с ролями:', userData.roles);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Ошибка при проверке пользователя:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
    }
  }, [])
  
  // Проверка пользователя при загрузке
  useEffect(() => {
    checkAuth()
  }, [])
  
  // Проверка роли пользователя
  const hasRole = (role) => {
    // Проверяем наличие пользователя и его ролей
    if (!user || !user.roles || !Array.isArray(user.roles)) {
      console.log('Отсутствуют данные о пользователе или его ролях');
      return false;
    }
    
    // Проверяем, является ли role массивом или строкой
    if (Array.isArray(role)) {
      const result = role.some(r => user.roles.includes(r));
      console.log(`Проверка ролей [${role.join(', ')}]: ${result ? 'успешно' : 'неуспешно'}`);
      return result;
    }
    
    const result = user.roles.includes(role);
    console.log(`Проверка роли ${role}: ${result ? 'успешно' : 'неуспешно'}`);
    return result;
  }
  
  // Проверка, является ли пользователь администратором
  const isAdmin = () => hasRole('admin')
  
  // Проверка, является ли пользователь менеджером
  const isManager = () => hasRole('manager')
  
  // Вход в систему
  const login = async (email, password) => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('Отправка запроса на вход:', email);
      
      // Отправка запроса на сервер
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3003/api'}/auth/login`, {
        email,
        password
      });
      
      console.log('Ответ от сервера:', response.data);
      
      if (response.data.success && response.data.token && response.data.user) {
        const { token, user } = response.data;
        
        // Сохранение токена и пользователя в localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Установка токена по умолчанию для axios
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Установка пользователя и статуса аутентификации
        setUser(user);
        setIsAuthenticated(true);
        
        console.log('Вход успешен для пользователя:', user.email, 'с ролями:', user.roles);
        return true;
      } else {
        setError('Неверный ответ от сервера');
        return false;
      }
    } catch (error) {
      console.error('Ошибка при входе:', error);
      
      if (error.response) {
        // Сервер вернул ошибку
        setError(error.response.data.error || error.response.data.message || 'Ошибка при входе в систему');
      } else if (error.request) {
        // Запрос был отправлен, но ответа не получено
        setError('Сервер не отвечает. Проверьте подключение.');
      } else {
        // Произошла ошибка при настройке запроса
        setError('Ошибка при входе в систему');
      }
      
      return false;
    } finally {
      setLoading(false)
    }
  }
  
  // Регистрация
  const register = async (userData) => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('Отправка запроса на регистрацию:', userData.email);
      
      // Отправка запроса на сервер
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3003/api'}/auth/register`, {
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone || null
      });
      
      console.log('Ответ от сервера:', response.data);
      
      if (response.data.success) {
        console.log('Регистрация успешна');
        return true;
      } else {
        setError(response.data.message || 'Ошибка при регистрации');
        return false;
      }
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      
      if (error.response) {
        setError(error.response.data.error || error.response.data.message || 'Ошибка при регистрации');
      } else if (error.request) {
        setError('Сервер не отвечает. Проверьте подключение.');
      } else {
        setError('Ошибка при регистрации');
      }
      
      return false;
    } finally {
      setLoading(false)
    }
  }
  
  // Выход из системы
  const logout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    setIsAuthenticated(false)
  }
  
  // Простая заглушка для обновления профиля
  const updateProfile = async (userData) => {
    return true;
  }
  
  // Простая заглушка для смены пароля
  const changePassword = async (currentPassword, newPassword) => {
    return true;
  }
  
  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    checkAuth,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    hasRole,
    isAdmin,
    isManager
  }
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
