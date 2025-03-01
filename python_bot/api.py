import logging
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from telegram.ext import Application

from database import db
from notifications import notify_about_new_gossip, notify_about_new_comment, notify_about_comment_reply

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Глобальная переменная для хранения экземпляра бота
bot_app: Optional[Application] = None

def set_bot_app(application: Application):
    """Установка экземпляра бота"""
    global bot_app
    bot_app = application

class GossipNotification(BaseModel):
    author_username: str
    author_id: str
    content: str

class CommentNotification(BaseModel):
    gossip_author_id: str
    comment_author_username: str
    gossip_content: str
    comment_content: str
    parent_comment_content: str | None = None
    parent_comment_author: str | None = None

class CommentReplyNotification(BaseModel):
    parent_comment_author_id: str
    comment_author_username: str
    gossip_content: str
    comment_content: str
    parent_comment_content: str

class BotUserResponse(BaseModel):
    id: str
    username: Optional[str]
    firstName: str
    anonymousName: str

@app.get("/bot_user/{user_id}")
async def get_bot_user(user_id: str):
    """Получение информации о пользователе бота"""
    try:
        user = await db.get_bot_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return BotUserResponse(
            id=user.id,
            username=user.username,
            firstName=user.firstName,
            anonymousName=user.anonymousName
        )
    except Exception as e:
        logger.error(f"Error getting bot user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/notify/gossip")
async def notify_gossip(notification: GossipNotification):
    """Эндпоинт для отправки уведомлений о новой сплетне"""
    try:
        if not bot_app:
            raise HTTPException(status_code=500, detail="Bot application not initialized")
        
        await notify_about_new_gossip(
            bot_app,
            notification.author_username,
            notification.content,
            notification.author_id
        )
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error sending gossip notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/notify/comment")
async def notify_comment(notification: CommentNotification):
    """Эндпоинт для отправки уведомлений о новом комментарии"""
    try:
        if not bot_app:
            raise HTTPException(status_code=500, detail="Bot application not initialized")
        
        await notify_about_new_comment(
            bot_app,
            notification.gossip_author_id,
            notification.comment_author_username,
            notification.gossip_content,
            notification.comment_content,
            notification.parent_comment_content,
            notification.parent_comment_author
        )
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error sending comment notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/notify/comment_reply")
async def notify_comment_reply(notification: CommentReplyNotification):
    """Эндпоинт для отправки уведомлений о ответе на комментарий"""
    try:
        if not bot_app:
            raise HTTPException(status_code=500, detail="Bot application not initialized")
        
        await notify_about_comment_reply(
            bot_app,
            notification.parent_comment_author_id,
            notification.comment_author_username,
            notification.gossip_content,
            notification.comment_content,
            notification.parent_comment_content
        )
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error sending comment reply notification: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 