import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { productsAPI, categoriesAPI } from '../utils/api'
import ProductCard from '../components/ui/ProductCard'

const CatalogPage = () => {
  const { categorySlug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [currentCategory, setCurrentCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    pages: 1
  })
  
  // Фильтры
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    brand: searchParams.get('brand') || '',
    sort: searchParams.get('sort') || 'name',
    order: searchParams.get('order') || 'asc'
  })
  
  // Список брендов
  const [brands, setBrands] = useState([])
  
  // Загрузка категорий
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesAPI.getAll()
        setCategories(response.data.categories)
      } catch (err) {
        console.error('Ошибка при загрузке категорий:', err)
        setError('Не удалось загрузить категории')
      }
    }
    
    fetchCategories()
  }, [])
  
  // Загрузка текущей категории
  useEffect(() => {
    const fetchCurrentCategory = async () => {
      if (!categorySlug) {
        setCurrentCategory(null)
        return
      }
      
      try {
        const response = await categoriesAPI.getBySlug(categorySlug)
        setCurrentCategory(response.data.category)
      } catch (err) {
        console.error('Ошибка при загрузке категории:', err)
        setError('Категория не найдена')
      }
    }
    
    fetchCurrentCategory()
  }, [categorySlug])
  
  // Загрузка товаров
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        
        const params = {
          page: searchParams.get('page') || 1,
          limit: pagination.limit,
          sort: filters.sort,
          order: filters.order
        }
        
        if (categorySlug) {
          params.category = categorySlug
        }
        
        if (filters.search) {
          params.search = filters.search
        }
        
        if (filters.minPrice) {
          params.minPrice = filters.minPrice
        }
        
        if (filters.maxPrice) {
          params.maxPrice = filters.maxPrice
        }
        
        if (filters.brand) {
          params.brand = filters.brand
        }
        
        const response = await productsAPI.getAll(params)
        setProducts(response.data.products)
        setPagination(response.data.pagination)
        
        // Собираем уникальные бренды
        const uniqueBrands = [...new Set(response.data.products.map(product => product.brand).filter(Boolean))]
        setBrands(uniqueBrands)
        
      } catch (err) {
        console.error('Ошибка при загрузке товаров:', err)
        setError('Не удалось загрузить товары')
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [categorySlug, searchParams, filters.sort, filters.order, pagination.limit])
  
  // Обработчик изменения фильтров
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }
  
  // Применение фильтров
  const applyFilters = () => {
    const params = {}
    
    if (filters.search) {
      params.search = filters.search
    }
    
    if (filters.minPrice) {
      params.minPrice = filters.minPrice
    }
    
    if (filters.maxPrice) {
      params.maxPrice = filters.maxPrice
    }
    
    if (filters.brand) {
      params.brand = filters.brand
    }
    
    if (filters.sort !== 'name' || filters.order !== 'asc') {
      params.sort = filters.sort
      params.order = filters.order
    }
    
    setSearchParams(params)
  }
  
  // Сброс фильтров
  const resetFilters = () => {
    setFilters({
      search: '',
      minPrice: '',
      maxPrice: '',
      brand: '',
      sort: 'name',
      order: 'asc'
    })
    setSearchParams({})
  }
  
  // Обработчик изменения страницы
  const handlePageChange = (page) => {
    searchParams.set('page', page)
    setSearchParams(searchParams)
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        {currentCategory ? currentCategory.name : 'Каталог товаров'}
      </h1>
      
      {currentCategory && currentCategory.description && (
        <p className="text-gray-600 mb-6">{currentCategory.description}</p>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Фильтры */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4">Фильтры</h2>
            
            <div className="space-y-4">
              {/* Поиск */}
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
                  placeholder="Введите название товара"
                />
              </div>
              
              {/* Цена */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Цена
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    name="minPrice"
                    value={filters.minPrice}
                    onChange={handleFilterChange}
                    className="input"
                    placeholder="От"
                    min="0"
                  />
                  <input
                    type="number"
                    name="maxPrice"
                    value={filters.maxPrice}
                    onChange={handleFilterChange}
                    className="input"
                    placeholder="До"
                    min="0"
                  />
                </div>
              </div>
              
              {/* Бренд */}
              {brands.length > 0 && (
                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                    Бренд
                  </label>
                  <select
                    id="brand"
                    name="brand"
                    value={filters.brand}
                    onChange={handleFilterChange}
                    className="input"
                  >
                    <option value="">Все бренды</option>
                    {brands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Сортировка */}
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
                  <option value="created_at">По новизне</option>
                </select>
              </div>
              
              {/* Порядок сортировки */}
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
              
              {/* Кнопки */}
              <div className="flex space-x-2">
                <button
                  onClick={applyFilters}
                  className="btn btn-primary flex-1"
                >
                  Применить
                </button>
                <button
                  onClick={resetFilters}
                  className="btn btn-outline flex-1"
                >
                  Сбросить
                </button>
              </div>
            </div>
          </div>
          
          {/* Категории */}
          <div className="bg-white rounded-lg shadow-md p-4 mt-6">
            <h2 className="text-xl font-semibold mb-4">Категории</h2>
            <ul className="space-y-2">
              {categories.map(category => (
                <li key={category.id}>
                  <a
                    href={`/catalog/${category.slug}`}
                    className={`block px-2 py-1 rounded hover:bg-gray-100 ${
                      categorySlug === category.slug ? 'bg-primary-50 text-primary-600 font-medium' : ''
                    }`}
                  >
                    {category.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Товары */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-8">Загрузка товаров...</div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">{error}</div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Товары не найдены</p>
              <button
                onClick={resetFilters}
                className="btn btn-outline mt-4"
              >
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default CatalogPage
