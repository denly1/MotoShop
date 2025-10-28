# 🔄 Инструкция по перезапуску

## Что было исправлено:

### 1. ✅ CORS настройки
- Добавлены разрешенные заголовки: `X-User-Role`, `X-Requested-With`
- Добавлен метод `PATCH`

### 2. ✅ API клиента
- Заменены кастомные заголовки на стандартный `Authorization: Bearer <token>`
- Теперь используется JWT токен из localStorage

### 3. ✅ Пароли обновлены
- Все пользователи используют пароль: `admin123`

## 🚀 Как перезапустить:

### Шаг 1: Остановите текущие процессы
Нажмите `Ctrl+C` в обоих терминалах (сервер и клиент)

### Шаг 2: Запустите сервер
```bash
cd c:\Users\Sasha\Desktop\MotoShop\server
npm run dev
```

### Шаг 3: Запустите клиент
```bash
cd c:\Users\Sasha\Desktop\MotoShop\client
npm run dev
```

### Шаг 4: Очистите localStorage в браузере
1. Откройте DevTools (F12)
2. Перейдите в Application → Local Storage
3. Удалите все записи для `http://localhost:5173`
4. Обновите страницу (F5)

### Шаг 5: Войдите в систему

#### Администратор:
- Email: `admin@motoshop.ru`
- Пароль: `admin123`

#### Менеджер:
- Email: `manager@motoshop.ru`
- Пароль: `admin123`

#### Покупатель:
- Email: `user@example.com`
- Пароль: `admin123`

## ✅ Проверка работы:

1. **Главная страница** - должны загружаться категории и товары
2. **Вход администратора** - должен успешно войти и перейти в `/admin`
3. **Админ-панель** - должны загружаться данные без ошибок CORS

## 🐛 Если проблемы остались:

### Проблема: CORS ошибки
**Решение:** Убедитесь, что сервер перезапущен после изменений

### Проблема: Не загружаются товары
**Решение:** 
1. Проверьте консоль браузера
2. Проверьте консоль сервера
3. Убедитесь, что база данных содержит товары:
   ```bash
   cd server
   node fix-database.js
   ```

### Проблема: Не работает вход
**Решение:**
1. Очистите localStorage
2. Обновите пароли:
   ```bash
   cd server
   node update-passwords.js
   ```

## 📝 Важные изменения:

### server/server.js (строки 30-36)
```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Role', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));
```

### client/src/utils/api.js (строки 9-18)
```javascript
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)
```

## 🎯 Ожидаемый результат:

После перезапуска:
- ✅ Главная страница загружает товары и категории
- ✅ Вход работает для всех типов пользователей
- ✅ Админ-панель загружается без ошибок
- ✅ Нет CORS ошибок в консоли
