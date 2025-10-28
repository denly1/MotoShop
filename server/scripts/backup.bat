@echo off
REM Скрипт для создания резервной копии базы данных

echo Создание резервной копии базы данных...
node %~dp0\backup.js backup
echo Готово!
pause
