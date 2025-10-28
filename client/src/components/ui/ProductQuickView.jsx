import { useState } from 'react'
import { useCart } from '../../context/CartContext'
import { formatPrice } from '../../utils/formatters'

const ProductQuickView = ({ product, isOpen, onClose }) => {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  
  if (!isOpen || !product) return null
  
  const handleAddToCart = () => {
    addToCart(product, quantity)
    onClose()
  }
  
  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta
    if (newQuantity >= 1 && newQuantity <= 99) {
      setQuantity(newQuantity)
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" aria-hidden="true"></div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div 
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <img 
                  src={product.image_url || 'https://via.placeholder.com/500'} 
                  alt={product.name}
                  className="w-full h-auto rounded-lg"
                />
                {product.is_featured && (
                  <span className="absolute top-4 left-4 bg-secondary-500 text-white text-sm px-3 py-1 rounded-full">
                    Хит продаж
                  </span>
                )}
                {product.old_price && (
                  <span className="absolute top-4 right-4 bg-red-500 text-white text-sm px-3 py-1 rounded-full">
                    -{Math.round((1 - product.price / product.old_price) * 100)}%
                  </span>
                )}
              </div>
              
              <div className="flex flex-col">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
                  
                  {product.brand && (
                    <p className="text-lg text-gray-600 mb-4">
                      <span className="font-medium">Бренд:</span> {product.brand}
                    </p>
                  )}
                  
                  {product.sku && (
                    <p className="text-sm text-gray-500 mb-4">
                      <span className="font-medium">Артикул:</span> {product.sku}
                    </p>
                  )}
                  
                  <div className="mb-6">
                    {product.old_price ? (
                      <div className="flex items-baseline space-x-3">
                        <span className="text-3xl font-bold text-secondary-600">
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-xl text-gray-500 line-through">
                          {formatPrice(product.old_price)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-3xl font-bold text-gray-900">
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>
                  
                  {product.description && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-2">Описание</h3>
                      <p className="text-gray-700 leading-relaxed">{product.description}</p>
                    </div>
                  )}
                  
                  <div className="mb-6 space-y-2">
                    {product.weight && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Вес:</span>
                        <span className="font-medium">{product.weight} кг</span>
                      </div>
                    )}
                    {product.dimensions && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Размеры:</span>
                        <span className="font-medium">{product.dimensions} мм</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-auto">
                  <div className="flex items-center space-x-4 mb-4">
                    <label className="text-sm font-medium text-gray-700">Количество:</label>
                    <div className="flex items-center border rounded-lg">
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1
                          if (val >= 1 && val <= 99) setQuantity(val)
                        }}
                        className="w-16 text-center border-x py-2"
                        min="1"
                        max="99"
                      />
                      <button
                        onClick={() => handleQuantityChange(1)}
                        className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                        disabled={quantity >= 99}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleAddToCart}
                    className="w-full btn btn-primary py-3 text-lg"
                    disabled={!product.is_active}
                  >
                    {product.is_active ? 'Добавить в корзину' : 'Нет в наличии'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductQuickView
