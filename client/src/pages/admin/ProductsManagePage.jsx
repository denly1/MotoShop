import { useState, useEffect } from 'react'
import axios from 'axios'
import { formatPrice } from '../../utils/formatters'
import ImageUpload from '../../components/ui/ImageUpload'

const ProductsManagePage = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    old_price: '',
    brand: '',
    image_url: '',
    is_active: true,
    is_featured: false
  })

  // Загрузка товаров
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3003/api'}/products`)
      setProducts(response.data.products || [])
    } catch (error) {
      console.error('Ошибка при загрузке товаров:', error)
    } finally {
      setLoading(false)
    }
  }

  // Открыть модальное окно для создания
  const handleCreate = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      sku: '',
      description: '',
      price: '',
      old_price: '',
      brand: '',
      image_url: '',
      is_active: true,
      is_featured: false
    })
    setShowModal(true)
  }

  // Открыть модальное окно для редактирования
  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      description: product.description || '',
      price: product.price || '',
      old_price: product.old_price || '',
      brand: product.brand || '',
      image_url: product.image_url || '',
      is_active: product.is_active !== false,
      is_featured: product.is_featured === true
    })
    setShowModal(true)
  }

  // Сохранить товар
  const handleSave = async (e) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('token')
      const url = editingProduct
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:3003/api'}/admin/products/${editingProduct.id}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:3003/api'}/admin/products`
      
      const method = editingProduct ? 'put' : 'post'
      
      await axios[method](url, formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      alert(editingProduct ? 'Товар обновлен!' : 'Товар создан!')
      setShowModal(false)
      fetchProducts()
    } catch (error) {
      console.error('Ошибка при сохранении:', error)
      alert('Ошибка при сохранении товара')
    }
  }

  // Удалить товар
  const handleDelete = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) return
    
    try {
      const token = localStorage.getItem('token')
      await axios.delete(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3003/api'}/admin/products/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      
      alert('Товар удален!')
      fetchProducts()
    } catch (error) {
      console.error('Ошибка при удалении:', error)
      alert('Ошибка при удалении товара')
    }
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">🛍️ Управление товарами</h1>
        <button onClick={handleCreate} className="btn btn-primary">
          ➕ Добавить товар
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Фото</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Артикул</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Цена</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <img 
                      src={product.image_url || 'https://via.placeholder.com/50'} 
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.brand}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{product.sku}</td>
                  <td className="px-6 py-4 text-sm font-medium">{formatPrice(product.price)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      ✏️ Изменить
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      🗑️ Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Модальное окно */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">
              {editingProduct ? '✏️ Редактировать товар' : '➕ Добавить товар'}
            </h2>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Название *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Артикул *</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Бренд</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Описание</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="input w-full"
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Цена *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Старая цена</label>
                  <input
                    type="number"
                    value={formData.old_price}
                    onChange={(e) => setFormData({...formData, old_price: e.target.value})}
                    className="input w-full"
                  />
                </div>
              </div>

              {/* Загрузка изображения */}
              <ImageUpload
                currentImage={formData.image_url}
                onImageUpload={(url) => setFormData({...formData, image_url: url})}
              />

              {/* Или вручную URL */}
              <div>
                <label className="block text-sm font-medium mb-1">Или введите URL изображения</label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  className="input w-full"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm">Активен</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm">Хит продаж</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-outline"
                >
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductsManagePage
