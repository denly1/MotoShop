import { useState, useEffect } from 'react'
import { adminAPI } from '../../utils/api'
import { formatDate } from '../../utils/formatters'

const AdminUsersPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  })
  
  // Состояние для модального окна редактирования пользователя
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    isActive: true,
    roles: []
  })
  
  // Состояние для фильтров
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    isActive: ''
  })
  
  // Загрузка пользователей
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        
        const params = {
          page: pagination.page,
          limit: pagination.limit
        }
        
        if (filters.search) {
          params.search = filters.search
        }
        
        if (filters.role) {
          params.role = filters.role
        }
        
        if (filters.isActive !== '') {
          params.isActive = filters.isActive
        }
        
        const response = await adminAPI.getUsers(params)
        
        setUsers(response.data.users)
        setPagination(response.data.pagination)
      } catch (err) {
        console.error('Ошибка при загрузке пользователей:', err)
        setError('Не удалось загрузить пользователей')
      } finally {
        setLoading(false)
      }
    }
    
    fetchUsers()
  }, [pagination.page, pagination.limit, filters])
  
  // Обработчик изменения страницы
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }))
  }
  
  // Обработчик изменения фильтров
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }
  
  // Открытие модального окна редактирования пользователя
  const openEditModal = (user) => {
    setCurrentUser(user)
    setFormData({
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone || '',
      isActive: user.is_active,
      roles: user.roles || []
    })
    setIsModalOpen(true)
  }
  
  // Обработчик изменения формы
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else if (name === 'roles') {
      const role = value
      const isChecked = e.target.checked
      
      setFormData(prev => ({
        ...prev,
        roles: isChecked
          ? [...prev.roles, role]
          : prev.roles.filter(r => r !== role)
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }
  
  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setFormLoading(true)
      setFormError(null)
      
      await adminAPI.updateUser(currentUser.id, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        is_active: formData.isActive,
        roles: formData.roles
      })
      
      // Обновление пользователя в списке
      setUsers(users.map(user => 
        user.id === currentUser.id 
          ? { 
              ...user, 
              first_name: formData.firstName,
              last_name: formData.lastName,
              phone: formData.phone,
              is_active: formData.isActive,
              roles: formData.roles
            } 
          : user
      ))
      
      // Закрытие модального окна
      setIsModalOpen(false)
    } catch (err) {
      console.error('Ошибка при обновлении пользователя:', err)
      setFormError('Ошибка при обновлении пользователя')
    } finally {
      setFormLoading(false)
    }
  }
  
  // Обработчик удаления пользователя
  const handleDeleteUser = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return
    }
    
    try {
      await adminAPI.deleteUser(id)
      
      // Обновление списка пользователей
      setUsers(users.filter(user => user.id !== id))
      alert('Пользователь успешно удален')
    } catch (err) {
      console.error('Ошибка при удалении пользователя:', err)
      alert('Ошибка при удалении пользователя')
    }
  }
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold">Управление пользователями</h1>
      </div>
      
      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Поиск
            </label>
            <input
              type="text"
              id="search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              className="input"
              placeholder="Email, имя или фамилия"
            />
          </div>
          
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Роль
            </label>
            <select
              id="role"
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              className="input"
            >
              <option value="">Все роли</option>
              <option value="admin">Администратор</option>
              <option value="manager">Менеджер</option>
              <option value="customer">Покупатель</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="isActive" className="block text-sm font-medium text-gray-700 mb-1">
              Статус
            </label>
            <select
              id="isActive"
              name="isActive"
              value={filters.isActive}
              onChange={handleFilterChange}
              className="input"
            >
              <option value="">Все пользователи</option>
              <option value="true">Активные</option>
              <option value="false">Заблокированные</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Таблица пользователей */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Загрузка пользователей...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow-md">
          <p className="text-gray-600 mb-4">Пользователи не найдены</p>
          <button
            onClick={() => {
              setFilters({
                search: '',
                role: '',
                isActive: ''
              })
            }}
            className="btn btn-outline"
          >
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Пользователь
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Контакты
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Роли
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата регистрации
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="text-sm text-gray-500">
                          {user.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {user.roles && user.roles.map(role => (
                          <span
                            key={role}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : role === 'manager'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {role === 'admin' ? 'Администратор' : role === 'manager' ? 'Менеджер' : 'Покупатель'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Активен' : 'Заблокирован'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Пагинация */}
          {pagination.pages > 1 && (
            <div className="flex justify-center py-4 border-t">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.page === 1}
                  className={`px-3 py-1 rounded ${
                    pagination.page === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  &laquo;
                </button>
                
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`px-3 py-1 rounded ${
                    pagination.page === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  &lsaquo;
                </button>
                
                {[...Array(pagination.pages)].map((_, i) => {
                  const page = i + 1
                  // Показываем только текущую страницу, первую, последнюю и соседние
                  if (
                    page === 1 ||
                    page === pagination.pages ||
                    (page >= pagination.page - 1 && page <= pagination.page + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded ${
                          pagination.page === page
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  } else if (
                    page === 2 ||
                    page === pagination.pages - 1
                  ) {
                    return <span key={page}>...</span>
                  }
                  return null
                })}
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className={`px-3 py-1 rounded ${
                    pagination.page === pagination.pages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  &rsaquo;
                </button>
                
                <button
                  onClick={() => handlePageChange(pagination.pages)}
                  disabled={pagination.page === pagination.pages}
                  className={`px-3 py-1 rounded ${
                    pagination.page === pagination.pages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  &raquo;
                </button>
              </nav>
            </div>
          )}
        </div>
      )}
      
      {/* Модальное окно редактирования пользователя */}
      {isModalOpen && currentUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsModalOpen(false)}></div>
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto p-6">
              <h2 className="text-xl font-semibold mb-4">
                Редактирование пользователя
              </h2>
              
              {formError && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
                  {formError}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      Имя
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleFormChange}
                      className="input"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Фамилия
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleFormChange}
                      className="input"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    className="input bg-gray-100"
                    disabled
                  />
                  <p className="mt-1 text-sm text-gray-500">Email нельзя изменить</p>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="input"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Роли
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="role-admin"
                        name="roles"
                        value="admin"
                        checked={formData.roles.includes('admin')}
                        onChange={handleFormChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="role-admin" className="ml-2 block text-sm text-gray-900">
                        Администратор
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="role-manager"
                        name="roles"
                        value="manager"
                        checked={formData.roles.includes('manager')}
                        onChange={handleFormChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="role-manager" className="ml-2 block text-sm text-gray-900">
                        Менеджер
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="role-customer"
                        name="roles"
                        value="customer"
                        checked={formData.roles.includes('customer')}
                        onChange={handleFormChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="role-customer" className="ml-2 block text-sm text-gray-900">
                        Покупатель
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleFormChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                      Активный пользователь
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-outline mr-2"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={formLoading}
                  >
                    {formLoading ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsersPage
