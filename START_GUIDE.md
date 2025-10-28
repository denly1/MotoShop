# 🚀 Руководство по запуску MotoShop

## Предварительные требования

- Node.js (v16 или выше)
- PostgreSQL (v12 или выше)
- npm или yarn

## Шаг 1: Настройка базы данных

### 1.1 Создайте базу данных PostgreSQL

```bash
psql -U postgres
CREATE DATABASE motoshop;
\q
```

### 1.2 Выполните SQL скрипты

```bash
# Создание схемы и таблиц
psql -U postgres -d motoshop -f database/schema.sql

# Заполнение начальными данными
psql -U postgres -d motoshop -f database/init.sql

# Обновление паролей для тестовых пользователей
psql -U postgres -d motoshop -f update_passwords.sql
```

## Шаг 2: Настройка сервера

### 2.1 Перейдите в папку сервера

```bash
cd server
```

### 2.2 Установите зависимости

```bash
npm install
```

### 2.3 Проверьте файл .env

Убедитесь, что файл `server/.env` содержит правильные настройки:

```env
NODE_ENV=development
PORT=3003

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=1
DB_NAME=motoshop

JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=1d
```

### 2.4 Запустите сервер

```bash
npm run dev
```

Сервер запустится на `http://localhost:3003`

## Шаг 3: Настройка клиента

### 3.1 Откройте новый терминал и перейдите в папку клиента

```bash
cd client
```

### 3.2 Установите зависимости

```bash
npm install
```

### 3.3 Проверьте файл .env

Убедитесь, что файл `client/.env` содержит:

```env
VITE_API_URL=http://localhost:3003/api
```

### 3.4 Запустите клиент

```bash
npm run dev
```

Клиент запустится на `http://localhost:5173`

## Шаг 4: Вход в систему

Откройте браузер и перейдите на `http://localhost:5173`

### Тестовые учетные данные:

#### Администратор
- Email: `admin@motoshop.ru`
- Пароль: `admin123`

#### Менеджер
- Email: `manager@motoshop.ru`
- Пароль: `manager123`

#### Покупатель
- Email: `user@example.com`
- Пароль: `user123`

## Проверка работы

### Проверка API

Откройте `http://localhost:3003/api` - должен вернуться JSON с информацией об API

### Проверка входа администратора

1. Перейдите на страницу входа
2. Введите email: `admin@motoshop.ru`
3. Введите пароль: `admin123`
4. Нажмите "Войти"
5. После успешного входа перейдите на `/admin`

## Решение проблем

### Ошибка подключения к базе данных

Проверьте:
- Запущен ли PostgreSQL
- Правильные ли учетные данные в `.env`
- Создана ли база данных `motoshop`

### Ошибка 404 на /api

Это нормально, если вы просто открываете `/api` в браузере. API работает корректно.

### Ошибка аутентификации

1. Убедитесь, что выполнен скрипт `update_passwords.sql`
2. Проверьте консоль браузера на наличие ошибок
3. Проверьте консоль сервера на наличие ошибок

### Перенаправление на страницу входа при попытке зайти в админ-панель

Это было исправлено. Убедитесь, что:
- Вы вошли с учетными данными администратора или менеджера
- В localStorage сохранены `user` и `token`
- Сервер возвращает правильные роли пользователя

## Структура проекта

```
MotoShop/
├── server/           # Backend (Express.js)
│   ├── controllers/  # Контроллеры
│   ├── db/          # Настройки БД
│   ├── middleware/  # Middleware
│   ├── routes/      # Маршруты
│   └── server.js    # Главный файл сервера
├── client/          # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/  # Компоненты
│   │   ├── context/     # Context API
│   │   ├── pages/       # Страницы
│   │   └── App.jsx      # Главный компонент
│   └── package.json
├── database/        # SQL скрипты
└── README.md
```

## Полезные команды

### Сервер
```bash
npm run dev      # Запуск в режиме разработки
npm start        # Запуск в продакшн режиме
```

### Клиент
```bash
npm run dev      # Запуск в режиме разработки
npm run build    # Сборка для продакшн
npm run preview  # Предпросмотр продакшн сборки
```

## Дополнительная информация

Подробные учетные данные смотрите в файле `CREDENTIALS.md`
