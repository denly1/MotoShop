import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const OrderSuccessPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  
  const { orderNumber, orderDate } = location.state || {}
  
  // Если нет данных о заказе, перенаправляем на главную
  useEffect(() => {
    if (!orderNumber) {
      navigate('/')
    }
  }, [orderNumber, navigate])
  
  if (!orderNumber) {
    return null
  }
  
  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-green-100 p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Заказ успешно оформлен!</h1>
        
        <p className="text-lg text-gray-600 mb-6">
          Спасибо за ваш заказ. Мы отправили подтверждение на вашу электронную почту.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-gray-700 mb-2">
            <span className="font-medium">Номер заказа:</span> {orderNumber}
          </p>
          {orderDate && (
            <p className="text-gray-700">
              <span className="font-medium">Дата заказа:</span> {orderDate}
            </p>
          )}
        </div>
        
        <p className="text-gray-600 mb-8">
          Мы свяжемся с вами в ближайшее время для подтверждения заказа.
          Вы можете отслеживать статус вашего заказа в личном кабинете.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link to="/orders" className="btn btn-primary">
            Мои заказы
          </Link>
          <Link to="/" className="btn btn-outline">
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  )
}

export default OrderSuccessPage
