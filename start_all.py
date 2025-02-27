import subprocess
import sys
import os
import asyncio
from threading import Thread

async def init_bot_db():
    # Импортируем и инициализируем базу данных
    sys.path.append(os.path.join(os.path.dirname(__file__), "python_bot"))
    from database import db
    await db.connect()

def run_python_bot():
    # Сначала инициализируем базу данных
    asyncio.run(init_bot_db())
    # Затем запускаем бота
    bot_path = os.path.join(os.path.dirname(__file__), "python_bot", "main.py")
    subprocess.run([sys.executable, bot_path])

def run_next_app():
    # Запускаем npm через shell
    if os.name == 'nt':  # для Windows
        subprocess.run("npm run dev", shell=True)
    else:  # для Unix-подобных систем
        subprocess.run(["npm", "run", "dev"])


if __name__ == "__main__":
    # Запускаем компоненты в отдельных потоках
    bot_thread = Thread(target=run_python_bot)
    next_thread = Thread(target=run_next_app)

    bot_thread.start()
    next_thread.start()

    # Ждем завершения всех потоков
    bot_thread.join()
    next_thread.join()