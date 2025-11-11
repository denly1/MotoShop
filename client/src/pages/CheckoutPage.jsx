import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { ordersAPI } from '../utils/api'
import { formatPrice } from '../utils/formatters'

const CheckoutPage = () => {
  const { cartItems, total, clearCart } = useCart()
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm()
  
  // Перенаправление, если корзина пуста или пользователь не авторизован
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } })
    } else if (cartItems.length === 0) {
      navigate('/cart')
    }
  }, [isAuthenticated, cartItems, navigate])
  
  // Заполнение формы данными пользователя
  useEffect(() => {
    if (user) {
      setValue('firstName', user.firstName || '')
      setValue('lastName', user.lastName || '')
      setValue('email', user.email || '')
      setValue('phone', user.phone || '')
    }
  }, [user, setValue])
  
  // Обработка отправки формы
  const onSubmit = async (data) => {
    if (cartItems.length === 0) {
      setError('Корзина пуста. Добавьте товары перед оформлением заказа.')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const orderData = {
        formData: data,
        cartItems,
        total
      }
      
      const response = await ordersAPI.create(orderData)
      
      if (response.data.success) {
        clearCart()
        navigate('/order-success', { 
          state: { 
            orderNumber: response.data.orderNumber,
            orderDate: response.data.orderDate
          } 
        })
      } else {
        setError(response.data.message || 'Ошибка при оформлении заказа')
      }
    } catch (err) {
      console.error('Ошибка при оформлении заказа:', err)
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Ошибка при оформлении заказа. Попробуйте позже.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Оформление заказа</h1>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Форма оформления заказа */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Контактная информация</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    Имя *
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    className={`input ${errors.firstName ? 'border-red-500' : ''}`}
                    {...register('firstName', { required: 'Введите имя' })}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Фамилия *
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    className={`input ${errors.lastName ? 'border-red-500' : ''}`}
                    {...register('lastName', { required: 'Введите фамилию' })}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`input ${errors.email ? 'border-red-500' : ''}`}
                    {...register('email', { 
                      required: 'Введите email',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Некорректный email'
                      }
                    })}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    className={`input ${errors.phone ? 'border-red-500' : ''}`}
                    {...register('phone', { 
                      required: 'Введите телефон',
                      pattern: {
                        value: /^[+]?[0-9]{10,15}$/,
                        message: 'Некорректный номер телефона'
                      }
                    })}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Адрес доставки</h2>
              
              <div className="mb-4">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Адрес *
                </label>
                <input
                  id="address"
                  type="text"
                  className={`input ${errors.address ? 'border-red-500' : ''}`}
                  {...register('address', { required: 'Введите адрес' })}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    Город *
                  </label>
                  <input
                    id="city"
                    type="text"
                    className={`input ${errors.city ? 'border-red-500' : ''}`}
                    {...register('city', { required: 'Введите город' })}
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Почтовый индекс *
                  </label>
                  <input
                    id="postalCode"
                    type="text"
                    className={`input ${errors.postalCode ? 'border-red-500' : ''}`}
                    {...register('postalCode', { 
                      required: 'Введите почтовый индекс',
                      pattern: {
                        value: /^[0-9]{6}$/,
                        message: 'Индекс должен содержать 6 цифр'
                      }
                    })}
                  />
                  {errors.postalCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Страна *
                </label>
                <select
                  id="country"
                  className={`input ${errors.country ? 'border-red-500' : ''}`}
                  {...register('country', { required: 'Выберите страну' })}
                  defaultValue="Россия"
                >
                  <option value="Россия">Россия</option>
                  <option value="Беларусь">Беларусь</option>
                  <option value="Казахстан">Казахстан</option>
                </select>
                {errors.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Способ оплаты</h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="paymentMethod-card"
                    type="radio"
                    value="card"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    {...register('paymentMethod', { required: 'Выберите способ оплаты' })}
                    defaultChecked
                  />
                  <label htmlFor="paymentMethod-card" className="ml-3 block text-sm font-medium text-gray-700">
                    Банковская карта
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="paymentMethod-cash"
                    type="radio"
                    value="cash"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    {...register('paymentMethod', { required: 'Выберите способ оплаты' })}
                  />
                  <label htmlFor="paymentMethod-cash" className="ml-3 block text-sm font-medium text-gray-700">
                    Наличными при получении
                  </label>
                </div>
              </div>
              
              {errors.paymentMethod && (
                <p className="mt-2 text-sm text-red-600">{errors.paymentMethod.message}</p>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Комментарий к заказу</h2>
              
              <textarea
                id="comments"
                rows="3"
                className="input"
                placeholder="Дополнительная информация к заказу"
                {...register('comments')}
              ></textarea>
            </div>
          </form>
        </div>
        
        {/* Итого */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Ваш заказ</h2>
            
            <div className="space-y-4 mb-6">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between pb-4 border-b">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.quantity} × {formatPrice(item.price)}</p>
                  </div>
                  <div className="font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
            
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
              onClick={handleSubmit(onSubmit)}
              className="btn btn-primary w-full mt-6"
              disabled={loading}
            >
              {loading ? 'Оформление...' : 'Оформить заказ'}
            </button>
            
            <p className="text-sm text-gray-500 mt-4">
              Нажимая кнопку "Оформить заказ", вы соглашаетесь с условиями обработки персональных данных и пользовательским соглашением.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
