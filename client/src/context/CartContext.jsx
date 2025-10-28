import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

export const useCart = () => useContext(CartContext)

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])
  const [total, setTotal] = useState(0)
  
  // Загрузка корзины из localStorage при инициализации
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        setCartItems(parsedCart)
      } catch (error) {
        console.error('Ошибка при загрузке корзины из localStorage:', error)
        setCartItems([])
      }
    }
  }, [])
  
  // Обновление общей суммы при изменении корзины
  useEffect(() => {
    const newTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    setTotal(newTotal)
    
    // Сохранение корзины в localStorage
    localStorage.setItem('cart', JSON.stringify(cartItems))
  }, [cartItems])
  
  // Добавление товара в корзину
  const addToCart = (product, quantity = 1) => {
    setCartItems(prevItems => {
      // Проверка, есть ли уже товар в корзине
      const existingItemIndex = prevItems.findIndex(item => item.id === product.id)
      
      if (existingItemIndex !== -1) {
        // Товар уже в корзине, увеличиваем количество
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity
        }
        return updatedItems
      } else {
        // Товар не в корзине, добавляем новый
        return [...prevItems, { ...product, quantity }]
      }
    })
  }
  
  // Обновление количества товара в корзине
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === productId ? { ...item, quantity } : item
      )
    )
  }
  
  // Удаление товара из корзины
  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId))
  }
  
  // Очистка корзины
  const clearCart = () => {
    setCartItems([])
    localStorage.removeItem('cart')
  }
  
  const value = {
    cartItems,
    total,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    itemCount: cartItems.reduce((count, item) => count + item.quantity, 0)
  }
  
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
