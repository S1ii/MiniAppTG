#!/bin/bash

# Остановка текущих процессов
pm2 stop all

# Обновление кода из репозитория
git pull

# Установка зависимостей
npm install

# Сборка проекта
npm run build

# Сборка бота
npm run build:bot

# Применение миграций Prisma
npx prisma migrate deploy

# Запуск приложений через PM2
pm2 start ecosystem.config.js

# Сохранение текущей конфигурации PM2
pm2 save 