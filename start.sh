#!/bin/bash

echo "========================================"
echo " MotoShop - Запуск приложения"
echo "========================================"
echo ""

echo "Проверка установки зависимостей..."
if [ ! -d "node_modules" ]; then
    echo "Установка зависимостей Frontend..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "Установка зависимостей Backend..."
    cd server
    npm install
    cd ..
fi

echo ""
echo "Проверка файла .env..."
if [ ! -f "server/.env" ]; then
    echo "Создание файла .env из env.example..."
    cp server/env.example server/.env
fi

echo ""
echo "========================================"
echo " Запуск серверов..."
echo "========================================"
echo ""
echo "Backend будет доступен на: http://localhost:3000"
echo "Frontend будет доступен на: http://localhost:5173"
echo ""
echo "Для остановки нажмите Ctrl+C"
echo ""

# Запуск backend в фоновом режиме
cd server
npm start &
BACKEND_PID=$!
cd ..

sleep 3

# Запуск frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo " Серверы запущены!"
echo "========================================"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Откройте браузер и перейдите на:"
echo "http://localhost:5173"
echo ""
echo "Для остановки нажмите Ctrl+C"
echo ""

# Ожидание завершения
wait

