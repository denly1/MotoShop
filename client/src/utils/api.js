import axios from 'axios'

// Создание экземпляра axios с базовым URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
})

// Добавление перехватчика запросов для добавления токена авторизации
api.interceptors.request.use(
  (config) => {
    // Получаем токен из localStorage
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Добавление перехватчика ответов для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Обработка ошибки 401 (Unauthorized)
    if (error.response && error.response.status === 401) {
      // Перенаправление на страницу входа
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API для аутентификации
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData)
}

// API для работы с категориями
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  getBySlug: (slug) => api.get(`/categories/${slug}`)
}

// API для работы с товарами
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getBySlug: (slug) => api.get(`/products/${slug}`),
  create: (productData) => api.post('/products', productData),
  update: (id, productData) => api.put(`/products/${id}`, productData),
  delete: (id) => api.delete(`/products/${id}`),
  updateInventory: (id, quantity) => api.put(`/products/${id}/inventory`, { quantity }),
  addReview: (id, reviewData) => api.post(`/products/${id}/reviews`, reviewData)
}

// API для работы с заказами
export const ordersAPI = {
  create: (orderData) => api.post('/orders', orderData),
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status, paymentStatus) => api.put(`/orders/${id}/status`, { status, paymentStatus })
}

// API для работы с админ-панелью
export const adminAPI = {
  getOrders: (params) => api.get('/admin/orders', { params }),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  exportProducts: () => api.get('/export/products', { responseType: 'blob' }),
  importProducts: (formData) => api.post('/import/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// API для работы с аналитикой
export const analyticsAPI = {
  getSales: (params) => api.get('/analytics/sales', { params }),
  getCategories: (params) => api.get('/analytics/categories', { params }),
  getUsers: (params) => api.get('/analytics/users', { params }),
  getSalesChart: (params) => api.get('/analytics/sales-chart', { 
    params,
    responseType: 'blob'
  }),
  exportSales: (params) => api.get('/analytics/export/sales', { 
    params,
    responseType: 'blob'
  })
}

export default api
