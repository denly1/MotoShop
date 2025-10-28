import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { productsAPI } from '../utils/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatPrice, formatDate, formatStockStatus, formatDiscount } from '../utils/formatters'

const ProductPage = () => {
  const { productSlug } = useParams()
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  
  // Состояние для отзыва
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const [reviewError, setReviewError] = useState(null)
  
  // Загрузка товара
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const response = await productsAPI.getBySlug(productSlug)
        setProduct(response.data.product)
        setActiveImage(0)
      } catch (err) {
        console.error('Ошибка при загрузке товара:', err)
        setError('Не удалось загрузить информацию о товаре')
      } finally {
        setLoading(false)
      }
    }
    
    fetchProduct()
  }, [productSlug])
  
  // Обработчик изменения количества
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value)
    if (value > 0 && (!product || value <= product.inStock)) {
      setQuantity(value)
    }
  }
  
  // Увеличение количества
  const increaseQuantity = () => {
    if (!product || quantity < product.inStock) {
      setQuantity(prev => prev + 1)
    }
  }
  
  // Уменьшение количества
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1)
    }
  }
  
  // Добавление в корзину
  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity)
    }
  }
  
  // Обработчик изменения формы отзыва
  const handleReviewChange = (e) => {
    const { name, value } = e.target
    setReviewForm(prev => ({ ...prev, [name]: value }))
  }
  
  // Отправка отзыва
  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      setReviewError('Необходимо войти в систему, чтобы оставить отзыв')
      return
    }
    
    try {
      setReviewSubmitting(true)
      setReviewError(null)
      
      await productsAPI.addReview(product.id, reviewForm)
      
      setReviewSuccess(true)
      setReviewForm({
        rating: 5,
        comment: ''
      })
    } catch (err) {
      console.error('Ошибка при отправке отзыва:', err)
      setReviewError(err.response?.data?.error || 'Не удалось отправить отзыв')
    } finally {
      setReviewSubmitting(false)
    }
  }
  
  if (loading) {
    return <div className="text-center py-8">Загрузка информации о товаре...</div>
  }
  
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/catalog" className="btn btn-primary">
          Вернуться в каталог
        </Link>
      </div>
    )
  }
  
  if (!product) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">Товар не найден</p>
        <Link to="/catalog" className="btn btn-primary">
          Вернуться в каталог
        </Link>
      </div>
    )
  }
  
  const stockStatus = formatStockStatus(product.inStock)
  
  return (
    <div>
      {/* Хлебные крошки */}
      <nav className="mb-6">
        <ol className="flex text-sm text-gray-500">
          <li>
            <Link to="/" className="hover:text-primary-600">
              Главная
            </Link>
            <span className="mx-2">/</span>
          </li>
          <li>
            <Link to="/catalog" className="hover:text-primary-600">
              Каталог
            </Link>
            <span className="mx-2">/</span>
          </li>
          {product.categories && product.categories[0] && (
            <li>
              <Link 
                to={`/catalog/${product.categories[0].slug}`}
                className="hover:text-primary-600"
              >
                {product.categories[0].name}
              </Link>
              <span className="mx-2">/</span>
            </li>
          )}
          <li className="text-gray-900 font-medium truncate">
            {product.name}
          </li>
        </ol>
      </nav>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Галерея изображений */}
        <div>
          <div className="bg-white rounded-lg overflow-hidden shadow-md mb-4">
            <img 
              src={product.images && product.images[activeImage] ? product.images[activeImage].image_url : 'https://via.placeholder.com/600'}
              alt={product.name}
              className="w-full h-auto object-contain aspect-square"
            />
          </div>
          
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`bg-white rounded-md overflow-hidden border-2 ${
                    activeImage === index ? 'border-primary-500' : 'border-transparent'
                  }`}
                >
                  <img 
                    src={image.image_url}
                    alt={`${product.name} - изображение ${index + 1}`}
                    className="w-full h-auto object-cover aspect-square"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Информация о товаре */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          
          {product.brand && (
            <p className="text-gray-600 mb-4">Бренд: {product.brand}</p>
          )}
          
          {/* Цена */}
          <div className="mb-6">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-gray-900 mr-3">
                {formatPrice(product.price)}
              </span>
              
              {product.old_price && (
                <>
                  <span className="text-lg text-gray-500 line-through mr-2">
                    {formatPrice(product.old_price)}
                  </span>
                  <span className="bg-secondary-500 text-white text-sm px-2 py-1 rounded">
                    {formatDiscount(product.price, product.old_price)}
                  </span>
                </>
              )}
            </div>
          </div>
          
          {/* Наличие */}
          <div className={`mb-6 ${stockStatus.class}`}>
            {stockStatus.text}
          </div>
          
          {/* Описание */}
          {product.description && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Описание</h2>
              <p className="text-gray-600">{product.description}</p>
            </div>
          )}
          
          {/* Характеристики */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Характеристики</h2>
            <table className="w-full">
              <tbody>
                {product.sku && (
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-gray-600">Артикул</td>
                    <td className="py-2 font-medium">{product.sku}</td>
                  </tr>
                )}
                {product.brand && (
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-gray-600">Бренд</td>
                    <td className="py-2 font-medium">{product.brand}</td>
                  </tr>
                )}
                {product.weight && (
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-gray-600">Вес</td>
                    <td className="py-2 font-medium">{product.weight} кг</td>
                  </tr>
                )}
                {product.dimensions && (
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-gray-600">Размеры</td>
                    <td className="py-2 font-medium">{product.dimensions}</td>
                  </tr>
                )}
                {product.categories && product.categories.length > 0 && (
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-gray-600">Категории</td>
                    <td className="py-2 font-medium">
                      {product.categories.map(cat => cat.name).join(', ')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Добавление в корзину */}
          {product.inStock > 0 && (
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={decreaseQuantity}
                    className="px-3 py-1 text-lg"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={handleQuantityChange}
                    className="w-12 text-center border-0 focus:ring-0"
                    min="1"
                    max={product.inStock}
                  />
                  <button
                    onClick={increaseQuantity}
                    className="px-3 py-1 text-lg"
                    disabled={quantity >= product.inStock}
                  >
                    +
                  </button>
                </div>
                <span className="ml-4 text-sm text-gray-500">
                  Доступно: {product.inStock} шт.
                </span>
              </div>
              
              <button
                onClick={handleAddToCart}
                className="btn btn-primary w-full"
              >
                Добавить в корзину
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Отзывы */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Отзывы</h2>
        
        {/* Форма отзыва */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Оставить отзыв</h3>
          
          {!isAuthenticated ? (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">
                Чтобы оставить отзыв, необходимо войти в систему
              </p>
              <Link to="/login" className="btn btn-primary">
                Войти
              </Link>
            </div>
          ) : reviewSuccess ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-md mb-4">
              Спасибо за ваш отзыв! Он будет опубликован после проверки модератором.
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit}>
              {reviewError && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
                  {reviewError}
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
                  Оценка
                </label>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                      className="text-2xl focus:outline-none"
                    >
                      <span className={star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'}>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                  Комментарий
                </label>
                <textarea
                  id="comment"
                  name="comment"
                  value={reviewForm.comment}
                  onChange={handleReviewChange}
                  rows="4"
                  className="input"
                  placeholder="Поделитесь своим мнением о товаре"
                ></textarea>
              </div>
              
              <button
                type="submit"
                className="btn btn-primary"
                disabled={reviewSubmitting}
              >
                {reviewSubmitting ? 'Отправка...' : 'Отправить отзыв'}
              </button>
            </form>
          )}
        </div>
        
        {/* Список отзывов */}
        {product.reviews && product.reviews.length > 0 ? (
          <div className="space-y-6">
            {product.reviews.map(review => (
              <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}>
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500">
                      {review.first_name} {review.last_name} • {formatDate(review.created_at)}
                    </p>
                  </div>
                </div>
                {review.comment && <p className="text-gray-700">{review.comment}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-4">
            У этого товара пока нет отзывов. Будьте первым!
          </p>
        )}
      </div>
    </div>
  )
}

export default ProductPage
