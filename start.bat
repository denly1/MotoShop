@echo off
echo ========================================
echo  MotoShop - Запуск приложения
echo ========================================
echo.

echo Проверка установки зависимостей...
if not exist "node_modules" (
    echo Установка зависимостей Frontend...
    call npm install
)

if not exist "server\node_modules" (
    echo Установка зависимостей Backend...
    cd server
    call npm install
    cd ..
)

echo.
echo Проверка файла .env...
if not exist "server\.env" (
    echo Создание файла .env из env.example...
    copy server\env.example server\.env
)

echo.
echo ========================================
echo  Запуск серверов...
echo ========================================
echo.
echo Backend будет доступен на: http://localhost:3000
echo Frontend будет доступен на: http://localhost:5173
echo.
echo Для остановки нажмите Ctrl+C в каждом окне
echo.

pause

echo Запуск Backend сервера в новом окне...
start "MotoShop Backend" cmd /k "cd server && npm start"

timeout /t 3 /nobreak > nul

echo Запуск Frontend в новом окне...
start "MotoShop Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo  Серверы запущены!
echo ========================================
echo.
echo Откройте браузер и перейдите на:
echo http://localhost:5173
echo.

pause

