import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI, ordersAPI } from '../../utils/api'
import { formatPrice, formatDate, formatOrderStatus, formatPaymentStatus } from '../../utils/formatters'

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  })
  
  // Состояние для модального окна изменения статуса
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [newPaymentStatus, setNewPaymentStatus] = useState('')
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusError, setStatusError] = useState(null)
  
  // Состояние для фильтров
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    sort: 'created_at',
    order: 'desc'
  })
  
  // Загрузка заказов
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          sort: filters.sort,
          order: filters.order
        }
        
        if (filters.search) {
          params.search = filters.search
        }
        
        if (filters.status) {
          params.status = filters.status
        }
        
        const response = await adminAPI.getOrders(params)
        
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
  
  // Открытие модального окна изменения статуса
  const openStatusModal = (order) => {
    setCurrentOrder(order)
    setNewStatus(order.status)
    setNewPaymentStatus(order.payment_status)
    setIsStatusModalOpen(true)
  }
  
  // Обработчик изменения статуса заказа
  const handleUpdateStatus = async () => {
    try {
      setStatusLoading(true)
      setStatusError(null)
      
      await ordersAPI.updateStatus(currentOrder.id, newStatus, newPaymentStatus)
      
      // Обновление заказа в списке
      setOrders(orders.map(order => 
        order.id === currentOrder.id 
          ? { ...order, status: newStatus, payment_status: newPaymentStatus } 
          : order
      ))
      
      // Закрытие модального окна
      setIsStatusModalOpen(false)
    } catch (err) {
      console.error('Ошибка при обновлении статуса заказа:', err)
      setStatusError('Ошибка при обновлении статуса заказа')
    } finally {
      setStatusLoading(false)
    }
  }
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold">Управление заказами</h1>
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
              placeholder="Номер заказа или email"
            />
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Статус
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="input"
            >
              <option value="">Все статусы</option>
              <option value="pending">Ожидает обработки</option>
              <option value="processing">В обработке</option>
              <option value="shipped">Отправлен</option>
              <option value="delivered">Доставлен</option>
              <option value="cancelled">Отменен</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
              Сортировка
            </label>
            <select
              id="sort"
              name="sort"
              value={filters.sort}
              onChange={handleFilterChange}
              className="input"
            >
              <option value="created_at">По дате</option>
              <option value="total_amount">По сумме</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Таблица заказов */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Загрузка заказов...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow-md">
          <p className="text-gray-600 mb-4">Заказы не найдены</p>
          <button
            onClick={() => {
              setFilters({
                search: '',
                status: '',
                sort: 'created_at',
                order: 'desc'
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
                    Заказ
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Клиент
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Сумма
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map(order => {
                  const orderStatus = formatOrderStatus(order.status)
                  const paymentStatus = formatPaymentStatus(order.payment_status)
                  
                  return (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{order.order_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(order.created_at, true)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.user ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {order.user.first_name} {order.user.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.user.email}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            Гость
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(order.total_amount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.items.length} товаров
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${orderStatus.class}`}>
                            {orderStatus.text}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatus.class}`}>
                            {paymentStatus.text}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openStatusModal(order)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          Изменить статус
                        </button>
                        <Link
                          to={`/orders/${order.id}`}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Подробнее
                        </Link>
                      </td>
                    </tr>
                  )
                })}
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
      
      {/* Модальное окно изменения статуса */}
      {isStatusModalOpen && currentOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsStatusModalOpen(false)}></div>
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto p-6">
              <h2 className="text-xl font-semibold mb-4">
                Изменение статуса заказа #{currentOrder.order_number}
              </h2>
              
              {statusError && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
                  {statusError}
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="newStatus" className="block text-sm font-medium text-gray-700 mb-1">
                  Статус заказа
                </label>
                <select
                  id="newStatus"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="input"
                >
                  <option value="pending">Ожидает обработки</option>
                  <option value="processing">В обработке</option>
                  <option value="shipped">Отправлен</option>
                  <option value="delivered">Доставлен</option>
                  <option value="cancelled">Отменен</option>
                </select>
              </div>
              
              <div className="mb-6">
                <label htmlFor="newPaymentStatus" className="block text-sm font-medium text-gray-700 mb-1">
                  Статус оплаты
                </label>
                <select
                  id="newPaymentStatus"
                  value={newPaymentStatus}
                  onChange={(e) => setNewPaymentStatus(e.target.value)}
                  className="input"
                >
                  <option value="pending">Ожидает оплаты</option>
                  <option value="paid">Оплачен</option>
                  <option value="failed">Ошибка оплаты</option>
                  <option value="refunded">Возврат средств</option>
                </select>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setIsStatusModalOpen(false)}
                  className="btn btn-outline mr-2"
                >
                  Отмена
                </button>
                <button
                  onClick={handleUpdateStatus}
                  className="btn btn-primary"
                  disabled={statusLoading}
                >
                  {statusLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrdersPage
