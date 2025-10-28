# 📡 API Endpoints

## ✅ Исправленные эндпоинты

### 1. Обновление статуса заказа
```
PUT /api/orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "status": "processing",  // pending, processing, shipped, delivered, cancelled
  "paymentStatus": "paid"  // pending, paid, failed, refunded (опционально)
}
```

### 2. Редактирование пользователя
```
PUT /api/admin/users/:id
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "firstName": "Иван",
  "lastName": "Петров",
  "phone": "+7 (999) 123-45-67",
  "isActive": true,
  "roleIds": [1, 2]  // ID ролей
}
```

### 3. Получение всех ролей
```
GET /api/roles
Authorization: Bearer <token>
```

## 📊 Новые дашборды

### 1. Общая статистика
```
GET /api/admin/dashboard/stats
Authorization: Bearer <token>

Возвращает:
- Общее количество заказов, выручка, пользователи, товары
- Статистика за последние 30 дней
- Топ-5 товаров
- Последние 10 заказов
- Заказы по статусам
- График продаж за последние 7 дней
```

### 2. Статистика по товарам
```
GET /api/admin/dashboard/products
Authorization: Bearer <token>

Возвращает:
- Общее количество товаров (всего, активных, избранных)
- Товары с низким остатком (< 10 шт)
- Товары по категориям
```

### 3. Статистика по пользователям
```
GET /api/admin/dashboard/users
Authorization: Bearer <token>
Требуется роль: admin

Возвращает:
- Общее количество пользователей (всего, активных, новых)
- Пользователи по ролям
- Топ-10 покупателей
```

### 4. Статистика по заказам
```
GET /api/admin/dashboard/orders
Authorization: Bearer <token>

Возвращает:
- Общее количество заказов
- Заказы за последние 30 дней
- Средний чек
- Заказы по статусам
- График заказов за последние 14 дней
```

## 🔧 Исправленные эндпоинты аналитики

### Статистика продаж
```
GET /api/admin/analytics/sales?startDate=2025-10-01&endDate=2025-10-28&groupBy=day
Authorization: Bearer <token>

Параметры:
- startDate: дата начала (YYYY-MM-DD)
- endDate: дата окончания (YYYY-MM-DD)
- groupBy: группировка (day, week, month)

Теперь обрабатывает пустые данные корректно!
```

## 🎯 Как тестировать

### 1. Перезапустите сервер
```bash
cd c:\Users\Sasha\Desktop\MotoShop\server
npm run dev
```

### 2. Войдите в систему
- Администратор: admin@motoshop.ru / admin123
- Менеджер: manager@motoshop.ru / manager123

### 3. Проверьте дашборды
Откройте в браузере:
- http://localhost:5173/admin - главный дашборд
- Должны загрузиться все виджеты со статистикой

### 4. Проверьте обновление статуса заказа
1. Перейдите в раздел "Заказы"
2. Нажмите на заказ
3. Измените статус
4. Сохраните

### 5. Проверьте редактирование пользователя
1. Перейдите в раздел "Пользователи" (только для админа)
2. Нажмите на пользователя
3. Измените данные
4. Сохраните

## 📝 Примечания

### Статусы заказов:
- `pending` - Ожидает обработки
- `processing` - В обработке
- `shipped` - Отправлен
- `delivered` - Доставлен
- `cancelled` - Отменен

### Статусы оплаты:
- `pending` - Ожидает оплаты
- `paid` - Оплачен
- `failed` - Ошибка оплаты
- `refunded` - Возврат средств

### Роли:
- `admin` - Администратор (полный доступ)
- `manager` - Менеджер (управление товарами и заказами)
- `customer` - Покупатель (покупка товаров)
- `guest` - Гость (просмотр каталога)
