# MotoShop Backend Server

Backend сервер для обработки заказов и отправки email уведомлений.

## Установка

```bash
cd server
npm install
```

## Настройка

Файл `.env` уже настроен с учетными данными Mail.ru SMTP.

## Запуск

```bash
# Production режим
npm start

# Development режим с авто-перезагрузкой
npm run dev
```

Сервер запустится на порту 3000.

## API Endpoints

### POST /api/orders
Создание нового заказа и отправка email уведомлений.

**Request Body:**
```json
{
  "formData": {
    "firstName": "Иван",
    "lastName": "Иванов",
    "email": "customer@example.com",
    "phone": "+7 900 123-45-67",
    "address": "ул. Ленина, 10",
    "city": "Москва",
    "postalCode": "123456",
    "paymentMethod": "card",
    "comments": "Комментарий"
  },
  "cartItems": [...],
  "total": 1890000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Заказ успешно оформлен",
  "orderNumber": "MS-1234567890",
  "orderDate": "15 октября 2025 г., 14:30"
}
```

### GET /api/health
Проверка состояния сервера.

## Email уведомления

При оформлении заказа отправляются два письма:
1. **В магазин** (smptxxxpocta@mail.ru) - уведомление о новом заказе
2. **Клиенту** - подтверждение заказа на указанный email

Письма содержат:
- Номер и дату заказа
- Контактную информацию клиента
- Список товаров с ценами
- Общую сумму заказа
- Способ оплаты
- Комментарии

