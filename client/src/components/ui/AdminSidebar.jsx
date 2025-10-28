import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const AdminSidebar = () => {
  const { user } = useAuth()
  const isAdmin = user?.roles?.includes('admin')
  
  return (
    <aside className="bg-gray-800 text-white w-64 flex-shrink-0 hidden md:block">
      <div className="p-4">
        <NavLink to="/" className="flex items-center mb-6">
          <span className="text-xl font-bold">🏍️ MotoShop</span>
        </NavLink>
        
        <nav>
          <ul className="space-y-2">
            <li>
              <NavLink 
                to="/admin" 
                end
                className={({ isActive }) => 
                  `flex items-center px-4 py-2 rounded-md ${isActive ? 'bg-primary-600' : 'hover:bg-gray-700'}`
                }
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Дашборд
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/admin/products-manage" 
                className={({ isActive }) => 
                  `flex items-center px-4 py-2 rounded-md ${isActive ? 'bg-primary-600' : 'hover:bg-gray-700'}`
                }
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Товары
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/admin/orders" 
                className={({ isActive }) => 
                  `flex items-center px-4 py-2 rounded-md ${isActive ? 'bg-primary-600' : 'hover:bg-gray-700'}`
                }
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Заказы
              </NavLink>
            </li>
            {isAdmin && (
              <li>
                <NavLink 
                  to="/admin/users" 
                  className={({ isActive }) => 
                    `flex items-center px-4 py-2 rounded-md ${isActive ? 'bg-primary-600' : 'hover:bg-gray-700'}`
                  }
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Пользователи
                </NavLink>
              </li>
            )}
            <li className="pt-4 mt-4 border-t border-gray-700">
              <NavLink 
                to="/" 
                className="flex items-center px-4 py-2 rounded-md hover:bg-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Вернуться на сайт
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  )
}

export default AdminSidebar
