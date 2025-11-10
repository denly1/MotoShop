import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ui/ProductCard'
import { productsAPI, categoriesAPI } from '../utils/api'

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Загрузка рекомендуемых товаров
        const productsResponse = await productsAPI.getAll({
          featured: true,
          limit: 8
        })
        
        // Загрузка категорий
        const categoriesResponse = await categoriesAPI.getAll()
        
        setFeaturedProducts(productsResponse.data.products)
        setCategories(categoriesResponse.data.categories.filter(cat => !cat.parent_id))
        
      } catch (err) {
        console.error('Ошибка при загрузке данных:', err)
        setError('Произошла ошибка при загрузке данных. Пожалуйста, попробуйте позже.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  return (
    <div>
      {/* Hero секция - простой и красивый */}
      <section className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200")',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}></div>
        </div>
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white leading-tight">
              🏍️ MotoShop
            </h1>
            <p className="text-xl md:text-2xl mb-4 text-gray-300">
              Лучшие мотоциклы и экипировка
            </p>
            <p className="text-lg mb-10 text-gray-400">
              Широкий выбор мототехники от ведущих производителей
            </p>
            <Link 
              to="/catalog" 
              className="inline-block bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
            >
              Смотреть каталог →
            </Link>
          </div>
        </div>
      </section>
      
      {/* Категории */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Категории товаров</h2>
          
          {loading ? (
            <div className="text-center py-8">Загрузка категорий...</div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">{error}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((category) => (
                <Link 
                  key={category.id} 
                  to={`/catalog/${category.slug}`}
                  className="group"
                >
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="aspect-square relative overflow-hidden">
                      <img 
                        src={category.image_url || 'https://via.placeholder.com/300'} 
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <h3 className="text-white text-xl font-bold">{category.name}</h3>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Рекомендуемые товары */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Хиты продаж</h2>
          
          {loading ? (
            <div className="text-center py-8">Загрузка товаров...</div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">{error}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              
              <div className="text-center mt-8">
                <Link to="/catalog" className="btn btn-outline">
                  Смотреть все товары
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
      
      {/* Преимущества - простой дизайн */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-gray-900">Почему выбирают нас</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow">
              <div className="text-6xl mb-4">🚚</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Быстрая доставка</h3>
              <p className="text-gray-600">Доставка по всей России. Отправка в день заказа</p>
            </div>
            
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Гарантия качества</h3>
              <p className="text-gray-600">Только оригинальная продукция с гарантией</p>
            </div>
            
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Поддержка 24/7</h3>
              <p className="text-gray-600">Наши специалисты всегда на связи</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
