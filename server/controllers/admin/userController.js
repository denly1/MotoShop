import db from '../../db/index.js';

/**
 * Получение списка всех пользователей
 */
export const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'id',
      order = 'asc',
      search
    } = req.query;

    // Базовый запрос
    let query = db('users')
      .select('users.*')
      .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
      .leftJoin('roles', 'user_roles.role_id', 'roles.id')
      .groupBy('users.id');

    // Поиск по имени, фамилии или email
    if (search) {
      query = query.where(function() {
        this.where('users.first_name', 'ilike', `%${search}%`)
            .orWhere('users.last_name', 'ilike', `%${search}%`)
            .orWhere('users.email', 'ilike', `%${search}%`);
      });
    }

    // Подсчет общего количества пользователей
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('users.id as count');

    // Получение пользователей с пагинацией и сортировкой
    const users = await query
      .orderBy(`users.${sort}`, order)
      .offset((page - 1) * limit)
      .limit(limit);

    // Получение ролей для каждого пользователя
    const usersWithRoles = await Promise.all(users.map(async (user) => {
      const roles = await db('roles')
        .join('user_roles', 'roles.id', 'user_roles.role_id')
        .where('user_roles.user_id', user.id)
        .select('roles.id', 'roles.name');

      return {
        ...user,
        roles
      };
    }));

    res.json({
      success: true,
      users: usersWithRoles,
      pagination: {
        total: parseInt(count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка при получении пользователей:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении пользователей',
      error: error.message
    });
  }
};

/**
 * Получение информации о конкретном пользователе
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Получение пользователя
    const user = await db('users')
      .where('id', id)
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Получение ролей пользователя
    const roles = await db('roles')
      .join('user_roles', 'roles.id', 'user_roles.role_id')
      .where('user_roles.user_id', id)
      .select('roles.id', 'roles.name');

    // Получение настроек пользователя
    const settings = await db('user_settings')
      .where('user_id', id)
      .first();

    // Получение заказов пользователя
    const orders = await db('orders')
      .where('user_id', id)
      .orderBy('created_at', 'desc')
      .limit(5);

    res.json({
      success: true,
      user: {
        ...user,
        roles,
        settings,
        recent_orders: orders
      }
    });
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении пользователя',
      error: error.message
    });
  }
};

/**
 * Обновление пользователя
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      email,
      firstName,
      lastName,
      phone,
      isActive,
      roleIds
    } = req.body;

    // Проверка существования пользователя
    const user = await db('users').where('id', id).first();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Проверка уникальности email
    if (email && email !== user.email) {
      const existingUser = await db('users').where('email', email).first();
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Пользователь с таким email уже существует'
        });
      }
    }

    // Транзакция для обновления пользователя и его ролей
    await db.transaction(async trx => {
      // Обновление пользователя
      await trx('users')
        .where('id', id)
        .update({
          email: email || user.email,
          first_name: firstName || user.first_name,
          last_name: lastName || user.last_name,
          phone: phone !== undefined ? phone : user.phone,
          is_active: isActive !== undefined ? isActive : user.is_active,
          updated_at: trx.fn.now()
        });

      // Обновление ролей пользователя, если они предоставлены
      if (roleIds && Array.isArray(roleIds)) {
        // Удаление существующих ролей
        await trx('user_roles').where('user_id', id).del();
        
        // Добавление новых ролей
        if (roleIds.length > 0) {
          const roleLinks = roleIds.map(roleId => ({
            user_id: id,
            role_id: roleId
          }));
          
          await trx('user_roles').insert(roleLinks);
        }
      }

      // Запись в аудит
      await trx('audit_log').insert({
        user_id: req.user.id,
        action: 'update',
        table_name: 'users',
        record_id: id,
        old_values: JSON.stringify({
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          is_active: user.is_active
        }),
        new_values: JSON.stringify({
          email: email || user.email,
          first_name: firstName || user.first_name,
          last_name: lastName || user.last_name,
          is_active: isActive !== undefined ? isActive : user.is_active
        }),
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
    });

    res.json({
      success: true,
      message: 'Пользователь успешно обновлен'
    });
  } catch (error) {
    console.error('Ошибка при обновлении пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении пользователя',
      error: error.message
    });
  }
};

/**
 * Удаление пользователя
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Проверка существования пользователя
    const user = await db('users').where('id', id).first();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Проверка, что пользователь не является администратором
    const isAdmin = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', id)
      .where('roles.name', 'admin')
      .first();

    if (isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Нельзя удалить администратора'
      });
    }

    // Транзакция для удаления пользователя и связанных данных
    await db.transaction(async trx => {
      // Удаление ролей пользователя
      await trx('user_roles').where('user_id', id).del();
      
      // Удаление настроек пользователя
      await trx('user_settings').where('user_id', id).del();
      
      // Удаление пользователя
      await trx('users').where('id', id).del();

      // Запись в аудит
      await trx('audit_log').insert({
        user_id: req.user.id,
        action: 'delete',
        table_name: 'users',
        record_id: id,
        old_values: JSON.stringify({
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name
        }),
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
    });

    res.json({
      success: true,
      message: 'Пользователь успешно удален'
    });
  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении пользователя',
      error: error.message
    });
  }
};

export default {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};
