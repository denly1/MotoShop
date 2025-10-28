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
      {/* Hero секция */}
      <section className="relative bg-primary-600 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Лучшие мотоциклы и экипировка
            </h1>
            <p className="text-lg mb-8 text-white opacity-90">
              Широкий выбор мототехники, запчастей и аксессуаров от ведущих мировых производителей
            </p>
            <Link to="/catalog" className="btn bg-white text-primary-600 hover:bg-gray-100">
              Перейти в каталог
            </Link>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 w-1/2 h-full hidden md:block">
          <div className="h-full w-full bg-center bg-cover" style={{ backgroundImage: "url('/images/hero-motorcycle.jpg')" }}></div>
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
      
      {/* Преимущества */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Наши преимущества</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-primary-600 text-4xl mb-4 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Быстрая доставка</h3>
              <p className="text-gray-600">Доставка по всей России. Отправка в день заказа при оформлении до 15:00.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-primary-600 text-4xl mb-4 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Гарантия качества</h3>
              <p className="text-gray-600">Только оригинальная продукция от официальных поставщиков с гарантией.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-primary-600 text-4xl mb-4 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Профессиональная консультация</h3>
              <p className="text-gray-600">Наши специалисты помогут с выбором и ответят на все вопросы.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
