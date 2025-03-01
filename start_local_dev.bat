@echo off
echo Запуск локальной среды разработки
echo.

REM Проверка установки loophole
where loophole >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Loophole не установлен! Пожалуйста, установите его с https://loophole.cloud/download
    pause
    exit /b
)

REM Проверка наличия Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Python не установлен!
    pause
    exit /b
)

REM Копирование .env.local в .env если существует
if exist .env.local (
    copy .env.local .env
) else (
    echo Файл .env.local не найден! Создайте его на основе примера из README.md
    pause
    exit /b
)

REM Установка зависимостей Node.js если node_modules не существует
if not exist node_modules (
    echo Установка Node.js зависимостей...
    call npm install
)

REM Создание и активация виртуального окружения Python
if not exist venv (
    echo Создание виртуального окружения Python...
    python -m venv venv
)

REM Активация виртуального окружения и установка зависимостей Python
call venv\Scripts\activate
echo Установка Python зависимостей...
pip install -r python_bot\requirements.txt

REM Применение миграций Prisma
echo Применение миграций Prisma...
call npx prisma migrate dev

REM Запуск Next.js приложения в режиме разработки в новом окне
echo Запуск Next.js приложения...
start "Next.js App" cmd /k "npm run dev"

REM Запуск Python бота в отдельном окне
echo Запуск Python бота...
start "Python Bot" cmd /k "venv\Scripts\python python_bot\main.py"

REM Даем время на запуск приложений
echo Ожидание запуска приложений...
timeout /t 10 /nobreak

REM Запуск loophole для создания туннелей в отдельных окнах
echo Создание туннелей через loophole...
REM start "Loophole App" cmd /k "loophole http 3000 --hostname bot-gossip-app"
REM start "Loophole WS" cmd /k "loophole http 3001 --hostname bot-gossip-ws"

echo.
echo Туннели созданы. Используйте следующие URL в вашем .env.local файле:
echo WEBAPP_URL=https://bot-gossip-app.loophole.site
echo NEXT_PUBLIC_WS_URL=wss://bot-gossip-ws.loophole.site
echo.
echo Для остановки закройте все открытые окна командной строки
echo Чтобы деактивировать виртуальное окружение Python, выполните 'deactivate'

REM Держим основное окно открытым
echo Нажмите любую клавишу для завершения всех процессов...
pause

REM Закрываем все открытые окна при выходе
taskkill /F /FI "WINDOWTITLE eq Next.js App*" >nul 2>nul
taskkill /F /FI "WINDOWTITLE eq Python Bot*" >nul 2>nul
taskkill /F /FI "WINDOWTITLE eq Loophole App*" >nul 2>nul
taskkill /F /FI "WINDOWTITLE eq Loophole WS*" >nul 2>nul