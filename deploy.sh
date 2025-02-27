#!/bin/bash

# Остановка текущих процессов
pm2 stop all

# Обновление кода из репозитория
git pull

# Установка Node.js зависимостей
npm install

# Установка Python зависимостей
pip install -r python_bot/requirements.txt

# Сборка Next.js проекта
npm run build

# Применение миграций Prisma
npx prisma migrate deploy

# Запуск приложений через PM2
pm2 start ecosystem.config.js

# Сохранение текущей конфигурации PM2
pm2 save 