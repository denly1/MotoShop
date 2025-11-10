import { useState, useEffect } from 'react'
import axios from 'axios'
import { formatPrice } from '../../utils/formatters'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

// Регистрация компонентов Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const DashboardPage = () => {
  const [dashboardStats, setDashboardStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Загрузка статистики дашборда
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true)
        
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3003/api'}/admin/dashboard/stats`)
        
        setDashboardStats(response.data.stats)
        setError(null)
      } catch (err) {
        console.error('Ошибка при загрузке статистики дашборда:', err)
        setError('Не удалось загрузить статистику дашборда')
      } finally {
        setLoading(false)
      }
    }
    
    fetchDashboardStats()
  }, [])
  
  // Форматирование статуса заказа
  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Ожидает',
      processing: 'В обработке',
      shipped: 'Отправлен',
      delivered: 'Доставлен',
      cancelled: 'Отменен'
    }
    return labels[status] || status
  }
  
  // Форматирование даты
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }
  
  const handleExport = async (type) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3003/api'}/admin/export/${type}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );
      
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка при экспорте:', error);
      alert('Ошибка при экспорте данных');
    }
  }
  
  return (
    <div>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Панель управления</h1>
          <p className="text-gray-600 mt-2">Общая статистика и аналитика магазина</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleExport('dashboard')}
            className="btn btn-outline text-sm"
            title="Экспорт дашборда в CSV"
          >
            📥 CSV
          </button>
          <button
            onClick={() => handleExport('products')}
            className="btn btn-outline text-sm"
            title="Экспорт товаров в CSV"
          >
            📦 Товары
          </button>
          <button
            onClick={() => handleExport('orders')}
            className="btn btn-outline text-sm"
            title="Экспорт заказов в CSV"
          >
            📋 Заказы
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-600 mt-4">Загрузка статистики...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 text-lg">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 btn btn-primary"
          >
            Обновить страницу
          </button>
        </div>
      ) : dashboardStats ? (
        <div className="space-y-6">
          {/* Основные показатели */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Всего заказов</p>
                  <p className="text-4xl font-bold">{dashboardStats.total.orders}</p>
                  <p className="text-blue-100 text-sm mt-2">За последние 30 дней: {dashboardStats.recent.orders}</p>
                </div>
                <div className="text-5xl opacity-20">📦</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Выручка</p>
                  <p className="text-4xl font-bold">{formatPrice(dashboardStats.total.revenue)}</p>
                  <p className="text-green-100 text-sm mt-2">За 30 дней: {formatPrice(dashboardStats.recent.revenue)}</p>
                </div>
                <div className="text-5xl opacity-20">💰</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Пользователи</p>
                  <p className="text-4xl font-bold">{dashboardStats.total.users}</p>
                  <p className="text-purple-100 text-sm mt-2">Новых за 30 дней: {dashboardStats.recent.users}</p>
                </div>
                <div className="text-5xl opacity-20">👥</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium mb-1">Товары</p>
                  <p className="text-4xl font-bold">{dashboardStats.total.products}</p>
                  <p className="text-orange-100 text-sm mt-2">Активных товаров</p>
                </div>
                <div className="text-5xl opacity-20">🛍️</div>
              </div>
            </div>
          </div>
          
          {/* Графики */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* График выручки */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <span className="mr-2">📈</span>
                Выручка за последние 7 дней
              </h2>
              <Line
                data={{
                  labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
                  datasets: [
                    {
                      label: 'Выручка (₽)',
                      data: dashboardStats.weeklyRevenue || [0, 0, 0, 0, 0, 0, 0],
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      fill: true,
                      tension: 0.4
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: (value) => formatPrice(value)
                      }
                    }
                  }
                }}
                height={250}
              />
            </div>

            {/* График заказов */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <span className="mr-2">📊</span>
                Заказы за последние 7 дней
              </h2>
              <Bar
                data={{
                  labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
                  datasets: [
                    {
                      label: 'Заказы',
                      data: dashboardStats.weeklyOrders || [0, 0, 0, 0, 0, 0, 0],
                      backgroundColor: 'rgba(34, 197, 94, 0.8)',
                      borderColor: 'rgb(34, 197, 94)',
                      borderWidth: 1
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1
                      }
                    }
                  }
                }}
                height={250}
              />
            </div>
          </div>

          {/* Топ товаров и последние заказы */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Топ товаров */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <span className="mr-2">🏆</span>
                Топ-5 товаров
              </h2>
              
              {dashboardStats.topProducts && dashboardStats.topProducts.length > 0 ? (
                <div className="space-y-3">
                  {dashboardStats.topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-sm text-gray-500">Продано: {product.total_sold} шт.</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatPrice(product.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Нет данных о продажах</p>
              )}
            </div>
            
            {/* Статусы заказов - круговая диаграмма */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <span className="mr-2">🎯</span>
                Распределение заказов по статусам
              </h2>
              
              {dashboardStats.ordersByStatus && dashboardStats.ordersByStatus.length > 0 ? (
                <div className="flex justify-center items-center" style={{ height: '250px' }}>
                  <Doughnut
                    data={{
                      labels: dashboardStats.ordersByStatus.map(item => getStatusLabel(item.status)),
                      datasets: [
                        {
                          data: dashboardStats.ordersByStatus.map(item => item.count),
                          backgroundColor: [
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(34, 197, 94, 0.8)',
                            'rgba(168, 85, 247, 0.8)',
                            'rgba(239, 68, 68, 0.8)',
                            'rgba(251, 191, 36, 0.8)'
                          ],
                          borderColor: [
                            'rgb(59, 130, 246)',
                            'rgb(34, 197, 94)',
                            'rgb(168, 85, 247)',
                            'rgb(239, 68, 68)',
                            'rgb(251, 191, 36)'
                          ],
                          borderWidth: 2
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Нет заказов</p>
              )}
            </div>
          </div>
          
          {/* Последние заказы */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="mr-2">📦</span>
              Последние заказы
            </h2>
            
            {dashboardStats.recentOrders && dashboardStats.recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Номер</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Клиент</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Сумма</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardStats.recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">
                          {order.order_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.first_name} {order.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {formatPrice(order.total_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Нет заказов</p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">Нет данных</p>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
