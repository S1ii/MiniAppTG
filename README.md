# Gossip Telegram Mini App

Мини-приложение Telegram для обмена сплетнями. Пользователи могут публиковать сплетни, лайкать и комментировать их.

## Технологии

- Next.js
- TypeScript
- SQLite3
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
BOT_TOKEN=""
WEBAPP_URL=""

# База данных
DATABASE_URL=""

# WebSocket URL
NEXT_PUBLIC_WS_URL="" 
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

## Локальная разработка

### Требования
- Node.js и npm
- [Loophole](https://loophole.cloud/download) для создания туннеля

### Запуск локально
1. Клонируйте репозиторий
2. Установите зависимости: `npm install`
3. Запустите скрипт `start_local_dev.bat` (Windows) или `start_local_dev.sh` (Linux/Mac)
4. Откроются туннели через loophole.cloud, которые предоставят публичные URL для вашего локального сервера
5. Обновите файл `.env.local` с полученными URL:
   ```
   WEBAPP_URL=https://ваш-проект-app.loophole.site
   NEXT_PUBLIC_WS_URL=wss://ваш-проект-ws.loophole.site
   ```

### Ручной запуск
1. Запустите ваше приложение: `npm start`
2. В отдельных терминалах запустите loophole для каждого порта:
   ```
   loophole http 3000 --hostname ваш-проект-app
   loophole http 3001 --hostname ваш-проект-ws
   ```

### Примечание
Если ваше приложение использует только один порт (3000), то достаточно создать только один туннель. 