import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const AdminHeader = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  
  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen)
  }
  
  const handleLogout = () => {
    logout()
    navigate('/')
  }
  
  const isAdmin = user?.roles?.includes('admin')
  const isManager = user?.roles?.includes('manager')
  
  return (
    <header className={`shadow-sm z-10 ${isAdmin ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}>
      <div className="px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="text-3xl">
            {isAdmin ? '👑' : '👔'}
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">
              {isAdmin ? 'Панель Администратора' : 'Панель Менеджера'}
            </h1>
            <p className="text-xs text-white opacity-90">
              {isAdmin ? 'Полный доступ ко всем функциям' : 'Управление товарами и заказами'}
            </p>
          </div>
        </div>
        
        {/* User Menu */}
        <div className="relative">
          <button
            onClick={toggleProfileMenu}
            className="flex items-center text-white hover:text-gray-200 focus:outline-none bg-white bg-opacity-20 px-3 py-2 rounded-lg"
          >
            <span className="mr-2 font-medium">{user?.firstName || (isAdmin ? 'Администратор' : 'Менеджер')}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
              <button
                onClick={() => navigate('/')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Вернуться на сайт
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Профиль
              </button>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Выйти
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default AdminHeader
