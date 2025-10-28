import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import db from '../../db/index.js';

// Регистрация нового пользователя
export const register = async (req, res) => {
  try {
    // Проверка ошибок валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password, firstName, lastName, phone } = req.body;

    // Проверка, существует ли пользователь с таким email
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Пользователь с таким email уже существует'
      });
    }

    // Хеширование пароля
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Создание пользователя
    const userResult = await db('users').insert({
      email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      is_active: true
    }).returning('id');
    
    // Извлечение ID пользователя из результата
    const userId = userResult[0].id || userResult[0];
    console.log('Создан пользователь с ID:', userId);

    // Назначение роли "customer" (покупатель)
    const customerRole = await db('roles').where({ name: 'customer' }).first();
    if (customerRole) {
      console.log('Найдена роль customer с ID:', customerRole.id);
      await db('user_roles').insert({
        user_id: userId,
        role_id: customerRole.id
      });
      console.log('Роль customer назначена пользователю');
    } else {
      console.log('Роль customer не найдена, создаем роль');
      // Создаем роль customer, если она не существует
      const [roleId] = await db('roles').insert({
        name: 'customer',
        description: 'Покупатель'
      }).returning('id');
      
      await db('user_roles').insert({
        user_id: userId,
        role_id: roleId
      });
      console.log('Создана роль customer и назначена пользователю');
    }

    // Создание настроек пользователя по умолчанию
    await db('user_settings').insert({
      user_id: userId
    });
    console.log('Созданы настройки пользователя по умолчанию');

    res.status(201).json({
      success: true,
      message: 'Пользователь успешно зарегистрирован'
    });
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при регистрации'
    });
  }
};

// Авторизация пользователя
export const login = async (req, res) => {
  try {
    // Проверка ошибок валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Поиск пользователя по email
    const user = await db('users').where({ email }).first();
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Неверный email или пароль'
      });
    }

    // Проверка активности аккаунта
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Аккаунт заблокирован'
      });
    }

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Неверный email или пароль'
      });
    }

    // Получение ролей пользователя
    const userRoles = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', user.id)
      .select('roles.name');

    const roles = userRoles.map(role => role.name);

    // Создание JWT токена
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roles
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    // Запись в аудит
    await db('audit_log').insert({
      user_id: user.id,
      action: 'login',
      table_name: 'users',
      record_id: user.id,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        roles
      }
    });
  } catch (error) {
    console.error('Ошибка при авторизации:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при авторизации'
    });
  }
};

// Получение профиля пользователя
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Получение данных пользователя
    const user = await db('users').where({ id: userId }).first();
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }

    // Получение ролей пользователя
    const userRoles = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', userId)
      .select('roles.name');

    const roles = userRoles.map(role => role.name);

    // Получение настроек пользователя
    const settings = await db('user_settings').where({ user_id: userId }).first();

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        isActive: user.is_active,
        roles,
        settings: settings || {},
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Ошибка при получении профиля:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при получении профиля'
    });
  }
};

// Обновление профиля пользователя
export const updateProfile = async (req, res) => {
  try {
    // Проверка ошибок валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const userId = req.user.id;
    const { firstName, lastName, phone } = req.body;

    // Обновление данных пользователя
    await db('users')
      .where({ id: userId })
      .update({
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        updated_at: db.fn.now()
      });

    // Запись в аудит
    await db('audit_log').insert({
      user_id: userId,
      action: 'update',
      table_name: 'users',
      record_id: userId,
      new_values: JSON.stringify({ firstName, lastName, phone }),
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'Профиль успешно обновлен'
    });
  } catch (error) {
    console.error('Ошибка при обновлении профиля:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при обновлении профиля'
    });
  }
};

// Смена пароля
export const changePassword = async (req, res) => {
  try {
    // Проверка ошибок валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Получение текущего пароля пользователя
    const user = await db('users').where({ id: userId }).first();
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }

    // Проверка текущего пароля
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Неверный текущий пароль'
      });
    }

    // Хеширование нового пароля
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Обновление пароля
    await db('users')
      .where({ id: userId })
      .update({
        password_hash: newPasswordHash,
        updated_at: db.fn.now()
      });

    // Запись в аудит
    await db('audit_log').insert({
      user_id: userId,
      action: 'password_change',
      table_name: 'users',
      record_id: userId,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'Пароль успешно изменен'
    });
  } catch (error) {
    console.error('Ошибка при смене пароля:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при смене пароля'
    });
  }
};
