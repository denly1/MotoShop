import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ordersAPI } from '../utils/api'
import { formatPrice, formatDate, formatOrderStatus, formatPaymentStatus } from '../utils/formatters'

const OrdersPage = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  })
  
  // Загрузка заказов
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        
        const response = await ordersAPI.getAll({
          page: pagination.page,
          limit: pagination.limit
        })
        
        setOrders(response.data.orders)
        setPagination(response.data.pagination)
      } catch (err) {
        console.error('Ошибка при загрузке заказов:', err)
        setError('Не удалось загрузить заказы')
      } finally {
        setLoading(false)
      }
    }
    
    fetchOrders()
  }, [pagination.page, pagination.limit])
  
  // Обработчик изменения страницы
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }))
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Мои заказы</h1>
      
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Загрузка заказов...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
            className="btn btn-primary"
          >
            Попробовать снова
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-semibold mb-2">У вас пока нет заказов</h2>
            <p className="text-gray-600 mb-6">Перейдите в каталог, чтобы совершить первую покупку</p>
            <Link to="/catalog" className="btn btn-primary">
              Перейти в каталог
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => {
            const orderStatus = formatOrderStatus(order.status)
            const paymentStatus = formatPaymentStatus(order.payment_status)
            
            return (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold">
                        Заказ #{order.order_number}
                      </h2>
                      <p className="text-gray-600">
                        от {formatDate(order.created_at, true)}
                      </p>
                    </div>
                    
                    <div className="mt-2 md:mt-0 flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${orderStatus.class}`}>
                        {orderStatus.text}
                      </span>
                      
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${paymentStatus.class}`}>
                        {paymentStatus.text}
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t border-b py-4 my-4">
                    <div className="space-y-2">
                      {order.items.map(item => (
                        <div key={item.id} className="flex justify-between">
                          <div className="flex items-center">
                            <span className="text-gray-600">{item.quantity} ×</span>
                            <span className="ml-2">{item.product_name}</span>
                          </div>
                          <span className="font-medium">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="text-lg font-bold">
                      Итого: {formatPrice(order.total_amount)}
                    </div>
                    
                    <div className="mt-4 md:mt-0">
                      <Link
                        to={`/orders/${order.id}`}
                        className="btn btn-outline"
                      >
                        Подробнее
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          
          {/* Пагинация */}
          {pagination.pages > 1 && (
            <div className="flex justify-center mt-8">
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
    </div>
  )
}

export default OrdersPage
