import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { productsAPI, adminAPI } from '../../utils/api'
import { formatPrice, formatStockStatus } from '../../utils/formatters'

const ProductsPage = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  })
  
  // Состояние для модального окна создания/редактирования товара
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentProduct, setCurrentProduct] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState(null)
  
  // Состояние для фильтров
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    sort: 'name',
    order: 'asc'
  })
  
  // Загрузка товаров
  useEffect(() => {
    const fetchProducts = async () => {
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
        
        if (filters.category) {
          params.category = filters.category
        }
        
        const response = await productsAPI.getAll(params)
        
        setProducts(response.data.products)
        setPagination(response.data.pagination)
      } catch (err) {
        console.error('Ошибка при загрузке товаров:', err)
        setError('Не удалось загрузить товары')
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
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
  
  // Обработчик экспорта товаров
  const handleExportProducts = async () => {
    try {
      const response = await adminAPI.exportProducts()
      
      // Создание ссылки для скачивания файла
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `products-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('Ошибка при экспорте товаров:', err)
      alert('Ошибка при экспорте товаров')
    }
  }
  
  // Обработчик импорта товаров
  const handleImportProducts = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      await adminAPI.importProducts(formData)
      
      // Перезагрузка товаров
      setPagination(prev => ({ ...prev, page: 1 }))
      alert('Импорт товаров успешно завершен')
    } catch (err) {
      console.error('Ошибка при импорте товаров:', err)
      alert('Ошибка при импорте товаров')
    } finally {
      // Сброс input file
      e.target.value = ''
    }
  }
  
  // Обработчик удаления товара
  const handleDeleteProduct = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
      return
    }
    
    try {
      await productsAPI.delete(id)
      
      // Обновление списка товаров
      setProducts(products.filter(product => product.id !== id))
      alert('Товар успешно удален')
    } catch (err) {
      console.error('Ошибка при удалении товара:', err)
      alert('Ошибка при удалении товара')
    }
  }
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold">Управление товарами</h1>
        
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setCurrentProduct(null)
              setIsModalOpen(true)
            }}
            className="btn btn-primary py-1 px-3 text-sm"
          >
            Добавить товар
          </button>
          
          <button
            onClick={handleExportProducts}
            className="btn btn-outline py-1 px-3 text-sm"
          >
            Экспорт CSV
          </button>
          
          <label className="btn btn-outline py-1 px-3 text-sm cursor-pointer">
            Импорт CSV
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportProducts}
            />
          </label>
        </div>
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
              placeholder="Название или описание"
            />
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
              <option value="name">По названию</option>
              <option value="price">По цене</option>
              <option value="created_at">По дате создания</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-1">
              Порядок
            </label>
            <select
              id="order"
              name="order"
              value={filters.order}
              onChange={handleFilterChange}
              className="input"
            >
              <option value="asc">По возрастанию</option>
              <option value="desc">По убыванию</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Таблица товаров */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Загрузка товаров...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow-md">
          <p className="text-gray-600 mb-4">Товары не найдены</p>
          <button
            onClick={() => {
              setFilters({
                search: '',
                category: '',
                sort: 'name',
                order: 'asc'
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
                    Товар
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Цена
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Наличие
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
                {products.map(product => {
                  const stockStatus = formatStockStatus(product.inStock)
                  
                  return (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 mr-4">
                            <img
                              src={product.image_url || 'https://via.placeholder.com/40'}
                              alt={product.name}
                              className="h-10 w-10 rounded-md object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {product.name}
                            </div>
                            {product.brand && (
                              <div className="text-sm text-gray-500">
                                {product.brand}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatPrice(product.price)}
                        </div>
                        {product.old_price && (
                          <div className="text-xs text-gray-500 line-through">
                            {formatPrice(product.old_price)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.inStock} шт.
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.is_active ? 'Активен' : 'Неактивен'}
                        </span>
                        {product.is_featured && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Хит продаж
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setCurrentProduct(product)
                            setIsModalOpen(true)
                          }}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Удалить
                        </button>
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
      
      {/* Модальное окно для создания/редактирования товара */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsModalOpen(false)}></div>
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-auto p-6">
              <h2 className="text-xl font-semibold mb-4">
                {currentProduct ? 'Редактирование товара' : 'Добавление товара'}
              </h2>
              
              <div className="text-center py-8">
                <p className="text-gray-600">
                  Форма для создания/редактирования товара будет реализована в следующих версиях.
                </p>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline mr-2"
                >
                  Отмена
                </button>
                <button
                  className="btn btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductsPage
