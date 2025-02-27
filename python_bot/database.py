import os
import sqlite3
import random
from datetime import datetime
from typing import Optional, List, Set
from dataclasses import dataclass
import threading

@dataclass
class BotUser:
    id: str
    username: Optional[str]
    firstName: str
    chatId: str
    createdAt: datetime
    lastSeen: datetime
    anonymousName: str

class Database:
    def __init__(self):
        self.db_path = os.path.join('..', 'dev.db')
        self._local = threading.local()
        self.names_path = os.path.join(os.path.dirname(__file__), 'names.txt')
        self.used_numbers: Set[int] = set()

    def _get_connection(self):
        if not hasattr(self._local, 'conn'):
            self._local.conn = sqlite3.connect(self.db_path)
            self._local.cursor = self._local.conn.cursor()
        return self._local.conn, self._local.cursor

    def _load_used_numbers(self):
        """Загружает использованные номера из базы данных"""
        conn, cursor = self._get_connection()
        cursor.execute("SELECT anonymousName FROM BotUser")
        for (name,) in cursor.fetchall():
            if '#' in name:
                try:
                    number = int(name.split('#')[1])
                    self.used_numbers.add(number)
                except (ValueError, IndexError):
                    continue

    def _generate_anonymous_name(self) -> str:
        """Генерирует уникальное анонимное имя"""
        with open(self.names_path, 'r', encoding='utf-8') as f:
            names = [line.strip() for line in f if line.strip()]
        
        base_name = random.choice(names)
        
        while True:
            number = random.randint(1000000, 9999999)
            if number not in self.used_numbers:
                self.used_numbers.add(number)
                return f"{base_name}#{number}"

    async def connect(self):
        """Подключение к базе данных и создание таблиц"""
        conn, cursor = self._get_connection()
        
        # Создаем таблицу BotUser, если она не существует
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS BotUser (
                id TEXT PRIMARY KEY,
                username TEXT,
                firstName TEXT NOT NULL,
                chatId TEXT UNIQUE NOT NULL,
                createdAt TEXT NOT NULL,
                lastSeen TEXT NOT NULL,
                anonymousName TEXT UNIQUE
            )
        """)
        
        conn.commit()
        
        # Загружаем использованные номера после создания таблицы
        self._load_used_numbers()
        
        return conn

    async def disconnect(self):
        """Отключение от базы данных"""
        if hasattr(self._local, 'conn'):
            self._local.conn.close()
            del self._local.conn
            del self._local.cursor

    async def upsert_bot_user(
        self,
        user_id: str,
        username: Optional[str],
        first_name: str,
        chat_id: str
    ) -> BotUser:
        """Создание или обновление пользователя бота"""
        conn, cursor = self._get_connection()
        now = datetime.now().isoformat()
        
        try:
            # Проверяем существование пользователя
            cursor.execute(
                "SELECT * FROM BotUser WHERE id = ?",
                (user_id,)
            )
            user = cursor.fetchone()

            if user:
                # Обновляем существующего пользователя
                cursor.execute("""
                    UPDATE BotUser 
                    SET username = ?, firstName = ?, chatId = ?, lastSeen = ?
                    WHERE id = ?
                """, (username, first_name, chat_id, now, user_id))
                anonymous_name = user[6]  # Используем существующее анонимное имя
            else:
                # Создаем нового пользователя с анонимным именем
                anonymous_name = self._generate_anonymous_name()
                cursor.execute("""
                    INSERT INTO BotUser (id, username, firstName, chatId, createdAt, lastSeen, anonymousName)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (user_id, username, first_name, chat_id, now, now, anonymous_name))

            conn.commit()

            return BotUser(
                id=user_id,
                username=username,
                firstName=first_name,
                chatId=chat_id,
                createdAt=datetime.fromisoformat(now if not user else user[4]),
                lastSeen=datetime.fromisoformat(now),
                anonymousName=anonymous_name
            )
        except Exception as e:
            conn.rollback()
            raise e

    async def get_all_bot_users(self) -> List[BotUser]:
        """Получение всех пользователей бота"""
        _, cursor = self._get_connection()
        cursor.execute("SELECT * FROM BotUser")
        users = cursor.fetchall()
        
        return [
            BotUser(
                id=user[0],
                username=user[1],
                firstName=user[2],
                chatId=user[3],
                createdAt=datetime.fromisoformat(user[4]),
                lastSeen=datetime.fromisoformat(user[5]),
                anonymousName=user[6]
            )
            for user in users
        ]

    async def get_bot_user(self, user_id: str) -> Optional[BotUser]:
        """Получение пользователя бота по ID"""
        _, cursor = self._get_connection()
        cursor.execute(
            "SELECT * FROM BotUser WHERE id = ?",
            (user_id,)
        )
        user = cursor.fetchone()

        if not user:
            return None

        return BotUser(
            id=user[0],
            username=user[1],
            firstName=user[2],
            chatId=user[3],
            createdAt=datetime.fromisoformat(user[4]),
            lastSeen=datetime.fromisoformat(user[5]),
            anonymousName=user[6]
        )

# Создаем глобальный экземпляр базы данных
db = Database() 