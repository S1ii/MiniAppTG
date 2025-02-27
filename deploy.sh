#!/bin/bash

# Остановка текущих процессов
pm2 stop all

# Обновление кода из репозитория
git pull

# Копирование production переменных окружения
cp .env.production .env.local

# Установка Node.js зависимостей
npm install

# Установка Python зависимостей
python3 -m pip install -r python_bot/requirements.txt

# Сборка Next.js проекта
npm run build

# Применение миграций Prisma
npx prisma migrate deploy

# Запуск приложений через PM2
pm2 start ecosystem.config.js

# Сохранение текущей конфигурации PM2
pm2 save 