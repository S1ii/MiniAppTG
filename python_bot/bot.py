import logging
import os
from datetime import datetime
from typing import Optional

from dotenv import load_dotenv
from telegram import Update, WebAppInfo, KeyboardButton, ReplyKeyboardMarkup, MenuButtonWebApp
from telegram.ext import Application, CommandHandler, ContextTypes

from database import db
from notifications import notify_about_new_gossip, notify_about_new_comment

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Загрузка переменных окружения
load_dotenv()
BOT_TOKEN = os.getenv('BOT_TOKEN')
WEBAPP_URL = os.getenv('WEBAPP_URL')

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработчик команды /start"""
    if not update.effective_user or not update.effective_chat:
        return

    user = update.effective_user
    chat_id = str(update.effective_chat.id)

    logger.info(f"Пользователь {user.first_name} (ID: {user.id}) запустил бота")

    # Сохраняем пользователя в базу данных
    try:
        bot_user = await db.upsert_bot_user(
            user_id=str(user.id),
            username=user.username,
            first_name=user.first_name,
            chat_id=chat_id
        )
        logger.info(f"✓ Пользователь {user.first_name} успешно сохранен в базе данных")

        # Создаем кнопку для открытия веб-приложения
        keyboard = [[KeyboardButton(
            text="Открыть приложение",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )]]
        reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True)

        # Отправляем приветственное сообщение с анонимным именем
        await update.message.reply_text(
            f"Привет! 👋\n\n"
            f"Ваше анонимное имя: {bot_user.anonymousName} 🎭\n\n"
            f"Все ваши сплетни и комментарии будут отображаться под этим именем. "
            f"Никто не узнает, кто вы на самом деле! 🤫\n\n"
            f"Нажмите на кнопку ниже, чтобы открыть приложение для сплетен.",
            reply_markup=reply_markup
        )
    except Exception as e:
        logger.error(f"❌ Ошибка при сохранении пользователя в базу данных: {e}")
        await update.message.reply_text(
            "Извините, произошла ошибка при запуске бота. Пожалуйста, попробуйте позже."
        )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработчик команды /help"""
    help_text = """
🤖 Доступные команды:
/start - Запустить бота и получить кнопку для открытия приложения
/help - Показать это сообщение
/about - Информация о боте
    """
    await update.message.reply_text(help_text)

async def about_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработчик команды /about"""
    about_text = """
📱 Gossip Bot - это бот для анонимного обмена сплетнями и новостями.

🔥 Возможности:
• Создавайте анонимные сплетни
• Комментируйте сплетни других пользователей
• Получайте уведомления о новых сплетнях
• Получайте уведомления о комментариях к вашим сплетням

👨‍💻 Разработчик: @your_username
    """
    await update.message.reply_text(about_text)

async def error_handler(update: Optional[Update], context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработчик ошибок"""
    logger.error(f"Произошла ошибка: {context.error}")

async def on_shutdown(application: Application) -> None:
    """Действия при остановке бота"""
    logger.info("Останавливаю бота...")
    await db.disconnect()
    logger.info("✓ База данных отключена")

async def on_startup(application: Application) -> None:
    """Действия при запуске бота"""
    logger.info("Инициализация бота...")
    
    # Подключаем базу данных
    await db.connect()
    logger.info("✓ База данных подключена")
    
    # Настраиваем веб-приложение
    try:
        await application.bot.set_my_commands([
            ("start", "Запустить бота"),
            ("help", "Помощь"),
            ("about", "О боте")
        ])
        
        # Настраиваем меню с веб-приложением
        await application.bot.set_chat_menu_button(
            menu_button=MenuButtonWebApp(text="Открыть приложение", web_app=WebAppInfo(url=WEBAPP_URL))
        )
        logger.info("✓ Веб-приложение настроено")
    except Exception as e:
        logger.error(f"❌ Ошибка при настройке веб-приложения: {e}")

def create_application() -> Application:
    """Создание и настройка приложения"""
    # Создаем приложение
    application = Application.builder().token(BOT_TOKEN).build()

    # Добавляем обработчики команд
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("about", about_command))
    application.add_error_handler(error_handler)

    return application

def main() -> None:
    """Запуск бота"""
    logger.info("Запуск Telegram бота...")
    logger.info(f"BOT_TOKEN присутствует: {bool(BOT_TOKEN)}")
    logger.info(f"WEBAPP_URL: {WEBAPP_URL}")

    # Создаем приложение
    application = create_application()

    # Добавляем действия при запуске и остановке
    application.post_init = on_startup
    application.post_shutdown = on_shutdown

    # Запускаем бота
    logger.info("✅ Telegram бот успешно запущен и готов к работе!")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main() 