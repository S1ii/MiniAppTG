# Gossip Telegram Mini App

Мини-приложение Telegram для обмена сплетнями. Пользователи могут публиковать сплетни, лайкать и комментировать их.

## Технологии

- Next.js
- TypeScript
- MongoDB
- Tailwind CSS
- Telegram Web App SDK

## Установка

1. Клонируйте репозиторий:
```bash
git clone [url-репозитория]
cd gossip-telegram-mini-app
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env.local` и добавьте следующие переменные окружения:
```
MONGODB_URI=your_mongodb_connection_string
```

4. Запустите приложение в режиме разработки:
```bash
npm run dev
```

## Деплой

1. Соберите приложение:
```bash
npm run build
```

2. Запустите production-версию:
```bash
npm start
```

## Настройка Telegram Mini App

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Создайте веб-приложение для вашего бота
3. Настройте URL вашего приложения в BotFather
4. Добавьте токен бота в `.env.local`:
```
BOT_TOKEN=your_bot_token
```

## Функциональность

- Публикация сплетен
- Лайки
- Комментарии
- Интеграция с Telegram Web App
- Адаптивный дизайн 