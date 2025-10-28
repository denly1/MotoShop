import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ordersAPI } from '../utils/api'
import { formatPrice, formatDate, formatOrderStatus, formatPaymentStatus } from '../utils/formatters'

const OrderDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Загрузка заказа
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true)
        const response = await ordersAPI.getById(id)
        setOrder(response.data.order)
      } catch (err) {
        console.error('Ошибка при загрузке заказа:', err)
        setError('Не удалось загрузить информацию о заказе')
      } finally {
        setLoading(false)
      }
    }
    
    fetchOrder()
  }, [id])
  
  if (loading) {
    return <div className="text-center py-8">Загрузка информации о заказе...</div>
  }
  
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/orders" className="btn btn-primary">
          Вернуться к списку заказов
        </Link>
      </div>
    )
  }
  
  if (!order) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">Заказ не найден</p>
        <Link to="/orders" className="btn btn-primary">
          Вернуться к списку заказов
        </Link>
      </div>
    )
  }
  
  const orderStatus = formatOrderStatus(order.status)
  const paymentStatus = formatPaymentStatus(order.payment_status)
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Заказ #{order.order_number}</h1>
          <p className="text-gray-600">от {formatDate(order.created_at, true)}</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Link to="/orders" className="btn btn-outline">
            Вернуться к списку заказов
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Основная информация */}
        <div className="lg:col-span-2 space-y-6">
          {/* Статус заказа */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Статус заказа</h2>
            
            <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${orderStatus.class}`}>
                {orderStatus.text}
              </span>
              
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${paymentStatus.class}`}>
                {paymentStatus.text}
              </span>
            </div>
          </div>
          
          {/* Товары */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <h2 className="text-lg font-semibold p-6 pb-3">Товары в заказе</h2>
            
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.items.map(item => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.image_url && (
                          <div className="h-10 w-10 flex-shrink-0 mr-4">
                            <img
                              src={item.image_url}
                              alt={item.product_name}
                              className="h-10 w-10 rounded-md object-cover"
                            />
                          </div>
                        )}
                        <div>
                          {item.slug ? (
                            <Link 
                              to={`/product/${item.slug}`}
                              className="font-medium text-gray-900 hover:text-primary-600"
                            >
                              {item.product_name}
                            </Link>
                          ) : (
                            <span className="font-medium text-gray-900">
                              {item.product_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatPrice(item.price)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity} шт.
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Адрес доставки */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Адрес доставки</h2>
            
            <address className="not-italic">
              <p>{order.shipping_address}</p>
              <p>{order.shipping_city}, {order.shipping_postal_code}</p>
              <p>{order.shipping_country}</p>
            </address>
          </div>
          
          {/* Примечания */}
          {order.notes && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Примечания к заказу</h2>
              <p className="text-gray-700">{order.notes}</p>
            </div>
          )}
        </div>
        
        {/* Сводка заказа */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Сводка заказа</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-4">
                <span className="text-gray-600">Товары ({order.items.reduce((acc, item) => acc + item.quantity, 0)} шт.)</span>
                <span className="font-medium">{formatPrice(order.total_amount)}</span>
              </div>
              
              <div className="flex justify-between border-b pb-4">
                <span className="text-gray-600">Доставка</span>
                <span className="font-medium text-green-600">Бесплатно</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-lg font-bold">Итого</span>
                <span className="text-lg font-bold">{formatPrice(order.total_amount)}</span>
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Способ оплаты</h3>
                <p className="text-gray-900">
                  {order.payment_method === 'card' ? 'Банковская карта' : 'Наличными при получении'}
                </p>
              </div>
              
              {order.user && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Контактная информация</h3>
                  <p className="text-gray-900">{order.user.first_name} {order.user.last_name}</p>
                  <p className="text-gray-900">{order.user.email}</p>
                  {order.user.phone && <p className="text-gray-900">{order.user.phone}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsPage
