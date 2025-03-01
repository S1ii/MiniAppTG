# 🗣️ Gossip Telegram Mini App

<div align="center">

*Мини-приложение Telegram для анонимного обмена сплетнями и новостями.*

[Установка](#-установка) •
[Разработка](#-разработка) •
[Деплой](#-деплой) •
[Технологии](#-технологии)

</div>

## 📋 Описание

Gossip - это мини-приложение Telegram, которое позволяет пользователям анонимно делиться сплетнями и новостями. Приложение поддерживает:

- 📝 Публикацию анонимных сообщений
- 👍 Лайки и реакции
- 💬 Комментарии
- 🔄 Живое обновление через WebSocket
- 📱 Адаптивный дизайн

## 🛠️ Технологии

- **Frontend**
  - Next.js
  - TypeScript
  - Tailwind CSS
  - Telegram Web App SDK

- **Backend**
  - Python FastAPI
  - SQLite3
  - Prisma ORM
  - WebSocket

## 🚀 Установка

1. **Клонирование репозитория**
   ```bash
   git clone [url-репозитория]
   cd gossip-telegram-mini-app
   ```

2. **Установка зависимостей**
   ```bash
   # Node.js зависимости
   npm install

   # Python зависимости
   python -m venv venv
   source venv/bin/activate  # Для Linux/Mac
   # или
   venv\Scripts\activate     # Для Windows
   pip install -r python_bot/requirements.txt
   ```

3. **Настройка окружения**
   
   Создайте файл `.env.local` и добавьте следующие переменные:
   ```env
   # Telegram Bot
   BOT_TOKEN="ваш_токен_бота"
   WEBAPP_URL="url_вашего_приложения"

   # База данных
   DATABASE_URL="file:./dev.db"

   # WebSocket
   NEXT_PUBLIC_WS_URL="ws://localhost:3001"
   ```

## 💻 Разработка

### Локальный запуск

#### Windows
1. Установите [Node.js](https://nodejs.org/en/download/)
2. Установите [Python](https://www.python.org/downloads/)
3. Установите [Loophole](https://loophole.cloud/download)
4. Создайте бота в telegram через [BotFather](https://t.me/BotFather)
5. Создайте файл `.env.local` и заполните его по примеру `.env.example`
4. В файле `.env.local` замените строку BOT_TOKEN="ваш_токен_бота" на токен вашего бота который вы получили от [BotFather](https://t.me/BotFather)
5. Замените в скрипте `start_local_dev.bat` строку 65 и 66 `start "Loophole App" cmd /k "loophole http 3000 --hostname YOUR-DOMAIN-HERE"` на свой домен
6. Запустите скрипт:
   ```bash
   start_local_dev.bat
   ```
7. В файле `.env.local` замените строку `WEBAPP_URL="https://url_вашего_приложения"` на свой домен который будет выдан loophole
8. В файле `.env.local` замените строку `NEXT_PUBLIC_WS_URL="ws://url_вашего_приложения"` на свой домен который будет выдан loophole

### Структура проекта
```
gossip-telegram-mini-app/
├── components/         # React компоненты
├── pages/             # Next.js страницы
├── prisma/            # Схема и миграции Prisma
├── python_bot/        # Telegram бот и FastAPI сервер
├── public/            # Статические файлы
└── styles/            # CSS стили
```

## 📦 Деплой

1. **Сборка проекта**
   ```bash
   npm run build
   ```

2. **Настройка production окружения**
   - Создайте `.env.production`
   - Настройте PM2 через `ecosystem.config.js`

3. **Запуск**
   ```bash
   ./deploy.sh
   ```

## 🔧 Настройка Telegram Mini App

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Выполните команду `/newapp`
3. Следуйте инструкциям для создания Web App
4. Добавьте полученный URL в настройки бота

## 📄 Лицензия

Этот проект распространяется под лицензией MIT. Подробности в файле [LICENSE](LICENSE).

## 👥 Участие в разработке

Мы приветствуем ваш вклад в проект! Пожалуйста:

1. Форкните репозиторий
2. Создайте ветку для ваших изменений
3. Создайте Pull Request

## 🐛 Сообщения об ошибках

Если вы нашли баг или у вас есть предложение по улучшению, пожалуйста, создайте Issue в репозитории. 