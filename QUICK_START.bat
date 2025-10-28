@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 MotoShop - Быстрый запуск
echo ========================================
echo.

echo 📝 Шаг 1: Обновление паролей в базе данных
echo.
echo Выполните следующую команду в PostgreSQL:
echo psql -U postgres -d motoshop -f update_passwords.sql
echo.
pause

echo.
echo 📦 Шаг 2: Запуск сервера
echo.
start cmd /k "cd /d %~dp0server && echo 🔧 Запуск сервера... && npm run dev"

timeout /t 3 >nul

echo.
echo 🌐 Шаг 3: Запуск клиента
echo.
start cmd /k "cd /d %~dp0client && echo 🎨 Запуск клиента... && npm run dev"

echo.
echo ========================================
echo ✅ Запуск завершен!
echo ========================================
echo.
echo 📍 Сервер: http://localhost:3003
echo 📍 Клиент: http://localhost:5173
echo.
echo 👤 Учетные данные администратора:
echo    Email: admin@motoshop.ru
echo    Пароль: admin123
echo.
echo 📖 Подробная инструкция: START_GUIDE.md
echo.
pause
