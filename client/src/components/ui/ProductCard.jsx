import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import ProductQuickView from './ProductQuickView'

const ProductCard = ({ product }) => {
  const { addToCart } = useCart()
  const [showQuickView, setShowQuickView] = useState(false)
  
  const handleAddToCart = (e) => {
    e.preventDefault()
    addToCart(product, 1)
  }
  
  const handleQuickView = (e) => {
    e.preventDefault()
    setShowQuickView(true)
  }
  
  // Форматирование цены
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(price)
  }
  
  return (
    <>
      <div className="card group">
        <Link to={`/product/${product.slug}`} className="block">
          {/* Изображение товара */}
          <div className="relative aspect-square overflow-hidden">
            <img 
              src={product.image_url || 'https://via.placeholder.com/300'} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {product.is_featured && (
              <span className="absolute top-2 left-2 bg-secondary-500 text-white text-xs px-2 py-1 rounded">
                Хит продаж
              </span>
            )}
            {product.old_price && (
              <span className="absolute top-2 right-2 bg-secondary-500 text-white text-xs px-2 py-1 rounded">
                Скидка {Math.round((1 - product.price / product.old_price) * 100)}%
              </span>
            )}
            
            {/* Кнопка быстрого просмотра */}
            <button
              onClick={handleQuickView}
              className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100"
            >
              <span className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium transform scale-90 group-hover:scale-100 transition-transform">
                👁️ Быстрый просмотр
              </span>
            </button>
          </div>
        
        {/* Информация о товаре */}
        <div className="p-4">
          <h3 className="text-lg font-medium line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
          
          {product.brand && (
            <p className="text-sm text-gray-500 mb-2">{product.brand}</p>
          )}
          
          <div className="flex justify-between items-center mt-4">
            <div>
              {product.old_price ? (
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-secondary-600">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(product.old_price)}
                  </span>
                </div>
              ) : (
                <span className="text-lg font-bold">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            
            <button 
              onClick={handleAddToCart}
              className="btn btn-primary text-sm py-1 px-3"
              disabled={product.inStock <= 0}
            >
              {product.inStock > 0 ? 'В корзину' : 'Нет в наличии'}
            </button>
          </div>
        </div>
      </Link>
    </div>
    
    {/* Модальное окно быстрого просмотра */}
    <ProductQuickView 
      product={product}
      isOpen={showQuickView}
      onClose={() => setShowQuickView(false)}
    />
  </>
  )
}

export default ProductCard
