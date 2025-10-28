/**
 * Форматирование цены в рублях
 * @param {number} price - Цена для форматирования
 * @param {boolean} showCurrency - Показывать символ валюты
 * @returns {string} Отформатированная цена
 */
export const formatPrice = (price, showCurrency = true) => {
  if (price === undefined || price === null) return ''
  
  return new Intl.NumberFormat('ru-RU', {
    style: showCurrency ? 'currency' : 'decimal',
    currency: 'RUB',
    maximumFractionDigits: 0
  }).format(price)
}

/**
 * Форматирование даты
 * @param {string|Date} date - Дата для форматирования
 * @param {boolean} showTime - Показывать время
 * @returns {string} Отформатированная дата
 */
export const formatDate = (date, showTime = false) => {
  if (!date) return ''
  
  const dateObj = new Date(date)
  
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(showTime && { hour: '2-digit', minute: '2-digit' })
  }
  
  return dateObj.toLocaleDateString('ru-RU', options)
}

/**
 * Форматирование статуса заказа
 * @param {string} status - Статус заказа
 * @returns {object} Объект с текстом и классом для отображения
 */
export const formatOrderStatus = (status) => {
  const statusMap = {
    pending: {
      text: 'Ожидает обработки',
      class: 'bg-yellow-100 text-yellow-800'
    },
    processing: {
      text: 'В обработке',
      class: 'bg-blue-100 text-blue-800'
    },
    shipped: {
      text: 'Отправлен',
      class: 'bg-indigo-100 text-indigo-800'
    },
    delivered: {
      text: 'Доставлен',
      class: 'bg-green-100 text-green-800'
    },
    cancelled: {
      text: 'Отменен',
      class: 'bg-red-100 text-red-800'
    }
  }
  
  return statusMap[status] || {
    text: status,
    class: 'bg-gray-100 text-gray-800'
  }
}

/**
 * Форматирование статуса оплаты
 * @param {string} status - Статус оплаты
 * @returns {object} Объект с текстом и классом для отображения
 */
export const formatPaymentStatus = (status) => {
  const statusMap = {
    pending: {
      text: 'Ожидает оплаты',
      class: 'bg-yellow-100 text-yellow-800'
    },
    paid: {
      text: 'Оплачен',
      class: 'bg-green-100 text-green-800'
    },
    failed: {
      text: 'Ошибка оплаты',
      class: 'bg-red-100 text-red-800'
    },
    refunded: {
      text: 'Возврат средств',
      class: 'bg-purple-100 text-purple-800'
    }
  }
  
  return statusMap[status] || {
    text: status,
    class: 'bg-gray-100 text-gray-800'
  }
}

/**
 * Форматирование полного имени пользователя
 * @param {object} user - Объект пользователя
 * @returns {string} Полное имя
 */
export const formatFullName = (user) => {
  if (!user) return ''
  
  const firstName = user.firstName || user.first_name || ''
  const lastName = user.lastName || user.last_name || ''
  
  return `${firstName} ${lastName}`.trim() || 'Пользователь'
}

/**
 * Форматирование процента скидки
 * @param {number} price - Текущая цена
 * @param {number} oldPrice - Старая цена
 * @returns {string} Процент скидки
 */
export const formatDiscount = (price, oldPrice) => {
  if (!oldPrice || !price || oldPrice <= price) return ''
  
  const discount = Math.round((1 - price / oldPrice) * 100)
  return `-${discount}%`
}

/**
 * Форматирование текста для отображения наличия товара
 * @param {number} inStock - Количество товара в наличии
 * @returns {object} Объект с текстом и классом для отображения
 */
export const formatStockStatus = (inStock) => {
  if (inStock === undefined || inStock === null) {
    return {
      text: 'Нет данных',
      class: 'text-gray-500'
    }
  }
  
  if (inStock <= 0) {
    return {
      text: 'Нет в наличии',
      class: 'text-red-600'
    }
  }
  
  if (inStock < 5) {
    return {
      text: 'Осталось мало',
      class: 'text-yellow-600'
    }
  }
  
  return {
    text: 'В наличии',
    class: 'text-green-600'
  }
}
