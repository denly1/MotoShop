import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Layouts
import MainLayout from './components/layouts/MainLayout'
import AdminLayout from './components/layouts/AdminLayout'

// Pages
import HomePage from './pages/HomePage'
import CatalogPage from './pages/CatalogPage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import OrdersPage from './pages/OrdersPage'
import OrderDetailsPage from './pages/OrderDetailsPage'
import AdminDashboardPage from './pages/admin/DashboardPage'
import AdminProductsPage from './pages/admin/ProductsPage'
import AdminProductsManagePage from './pages/admin/ProductsManagePage'
import AdminOrdersPage from './pages/admin/OrdersPage'
import AdminUsersPage from './pages/admin/UsersPage'
import NotFoundPage from './pages/NotFoundPage'

// Protected Route Component
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, hasRole } = useAuth()
  
  // Проверяем аутентификацию
  if (!isAuthenticated) {
    console.log('Пользователь не аутентифицирован, перенаправление на /login');
    return <Navigate to="/login" replace />
  }
  
  // Проверяем наличие пользователя и его ролей
  if (!user || !user.roles) {
    console.log('Отсутствуют данные о пользователе или его ролях');
    localStorage.removeItem('user'); // Удаляем некорректные данные
    return <Navigate to="/login" replace />
  }
  
  // Проверяем роли, если они указаны
  if (roles) {
    console.log('Проверка ролей:', roles, 'у пользователя:', user.roles);
    
    // Проверяем, есть ли у пользователя хотя бы одна из необходимых ролей
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    const hasRequiredRole = requiredRoles.some(role => user.roles.includes(role));
    
    if (!hasRequiredRole) {
      console.log('Недостаточно прав, перенаправление на /');
      return <Navigate to="/" replace />
    }
    
    console.log('Проверка ролей пройдена успешно');
  }
  
  // Если все проверки пройдены, отображаем дочерние элементы
  return children
}

function App() {
  const { checkAuth } = useAuth()
  
  useEffect(() => {
    checkAuth()
  }, [checkAuth])
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="catalog/:categorySlug" element={<CatalogPage />} />
        <Route path="product/:productSlug" element={<ProductPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="order-success" element={<OrderSuccessPage />} />
      </Route>
      
      {/* Protected User Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailsPage />} />
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin', 'manager']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="products-manage" element={<AdminProductsManagePage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="users" element={
          <ProtectedRoute roles={['admin']}>
            <AdminUsersPage />
          </ProtectedRoute>
        } />
      </Route>
      
      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
