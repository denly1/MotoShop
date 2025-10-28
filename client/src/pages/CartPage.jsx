import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../utils/formatters'

const CartPage = () => {
  const { cartItems, total, updateQuantity, removeFromCart, clearCart } = useCart()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  
  const [isRemoving, setIsRemoving] = useState(false)
  
  // Обработчик изменения количества товара
  const handleQuantityChange = (productId, quantity) => {
    updateQuantity(productId, parseInt(quantity))
  }
  
  // Обработчик удаления товара из корзины
  const handleRemoveItem = (productId) => {
    setIsRemoving(true)
    setTimeout(() => {
      removeFromCart(productId)
      setIsRemoving(false)
    }, 300)
  }
  
  // Переход к оформлению заказа
  const handleCheckout = () => {
    if (isAuthenticated) {
      navigate('/checkout')
    } else {
      navigate('/login', { state: { from: '/checkout' } })
    }
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Корзина</h1>
      
      {cartItems.length === 0 ? (
        <div className="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h2 className="text-xl font-semibold mb-2">Ваша корзина пуста</h2>
          <p className="text-gray-600 mb-6">Добавьте товары в корзину, чтобы оформить заказ</p>
          <Link to="/catalog" className="btn btn-primary">
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Список товаров */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Товар
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Цена
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Количество
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Сумма
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Удалить</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cartItems.map(item => (
                    <tr 
                      key={item.id} 
                      className={`transition-opacity duration-300 ${isRemoving ? 'opacity-50' : 'opacity-100'}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                            <img
                              src={item.image_url || 'https://via.placeholder.com/150'}
                              alt={item.name}
                              className="h-full w-full object-cover object-center"
                            />
                          </div>
                          <div className="ml-4">
                            <Link 
                              to={`/product/${item.slug}`}
                              className="font-medium text-gray-900 hover:text-primary-600"
                            >
                              {item.name}
                            </Link>
                            {item.brand && (
                              <div className="text-sm text-gray-500">{item.brand}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatPrice(item.price)}</div>
                        {item.old_price && (
                          <div className="text-xs text-gray-500 line-through">
                            {formatPrice(item.old_price)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center border border-gray-300 rounded-md w-24">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="px-2 py-1 text-gray-600 hover:text-gray-900"
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            className="w-10 text-center border-0 focus:ring-0"
                            min="1"
                          />
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="px-2 py-1 text-gray-600 hover:text-gray-900"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex justify-between">
              <Link to="/catalog" className="btn btn-outline">
                Продолжить покупки
              </Link>
              <button
                onClick={clearCart}
                className="btn btn-outline text-red-600 border-red-600 hover:bg-red-50"
              >
                Очистить корзину
              </button>
            </div>
          </div>
          
          {/* Итого */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Итого</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between border-b pb-4">
                  <span className="text-gray-600">Товары ({cartItems.reduce((acc, item) => acc + item.quantity, 0)} шт.)</span>
                  <span className="font-medium">{formatPrice(total)}</span>
                </div>
                
                <div className="flex justify-between border-b pb-4">
                  <span className="text-gray-600">Доставка</span>
                  <span className="font-medium text-green-600">Бесплатно</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-lg font-bold">Итого</span>
                  <span className="text-lg font-bold">{formatPrice(total)}</span>
                </div>
              </div>
              
              <button
                onClick={handleCheckout}
                className="btn btn-primary w-full mt-6"
              >
                Оформить заказ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CartPage
