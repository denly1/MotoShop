import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)
  
  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }
  
  const toggleProfileMenu = (e) => {
    e.stopPropagation()
    setIsProfileMenuOpen(!isProfileMenuOpen)
  }
  
  const handleLogout = () => {
    setIsProfileMenuOpen(false)
    logout()
    navigate('/')
  }
  
  const closeProfileMenu = () => {
    setIsProfileMenuOpen(false)
  }
  
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-primary-600">🏍️ MotoShop</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-600 hover:text-primary-600">Главная</Link>
            <Link to="/catalog" className="text-gray-600 hover:text-primary-600">Каталог</Link>
          </nav>
          
          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link to="/cart" className="relative text-gray-600 hover:text-primary-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-secondary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
            
            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={toggleProfileMenu}
                  className="flex items-center text-gray-600 hover:text-primary-600 focus:outline-none"
                >
                  <span className="mr-2">{user?.firstName || 'Пользователь'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <Link 
                      to="/profile" 
                      onClick={closeProfileMenu}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      👤 Профиль
                    </Link>
                    <Link 
                      to="/orders" 
                      onClick={closeProfileMenu}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📦 Мои заказы
                    </Link>
                    {(user?.roles?.includes('admin') || user?.roles?.includes('manager')) && (
                      <Link 
                        to="/admin" 
                        onClick={closeProfileMenu}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-200"
                      >
                        {user?.roles?.includes('admin') ? '👑 Панель администратора' : '👔 Панель менеджера'}
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-200"
                    >
                      🚪 Выйти
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="text-gray-600 hover:text-primary-600">
                Войти
              </Link>
            )}
            
            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden text-gray-600 hover:text-primary-600 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t">
            <Link to="/" className="block py-2 text-gray-600 hover:text-primary-600">Главная</Link>
            <Link to="/catalog" className="block py-2 text-gray-600 hover:text-primary-600">Каталог</Link>
          </nav>
        )}
      </div>
    </header>
  )
}

export default Header
