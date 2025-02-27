import asyncio
import logging
import uvicorn
from threading import Thread
from telegram.ext import Application
from telegram import Update

from bot import create_application
from api import app, set_bot_app
from database import db

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

def run_api():
    """Запуск FastAPI сервера"""
    uvicorn.run(app, host="0.0.0.0", port=3001)

async def run_bot(application: Application):
    """Запуск Telegram бота"""
    try:
        await application.initialize()
        await application.start()
        logger.info("✅ Telegram бот успешно запущен и готов к работе!")
        
        # Запускаем бота в режиме long polling
        await application.updater.start_polling(allowed_updates=Update.ALL_TYPES)
        
        # Ждем сигнала остановки
        stop_signal = asyncio.Event()
        await stop_signal.wait()
    except asyncio.CancelledError:
        logger.info("Получен сигнал остановки")
    finally:
        await application.updater.stop()
        await application.stop()

async def main():
    """Основная функция запуска приложения"""
    try:
        # Инициализация базы данных
        await db.connect()
        logger.info("✓ База данных подключена")

        # Создаем приложение
        application = create_application()
        set_bot_app(application)

        # Запуск API в отдельном потоке
        api_thread = Thread(target=run_api, daemon=True)
        api_thread.start()
        logger.info("✓ API сервер запущен на порту 3001")

        # Запуск бота
        await run_bot(application)
    except KeyboardInterrupt:
        logger.info("Завершение работы по команде пользователя")
    except Exception as e:
        logger.error(f"❌ Ошибка при запуске приложения: {e}")
    finally:
        await db.disconnect()
        logger.info("✓ База данных отключена")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Завершение работы по команде пользователя")
    except Exception as e:
        logger.error(f"Критическая ошибка: {e}") 