import logging
from telegram.ext import Application
from telegram.error import Forbidden, BadRequest

from database import db

logger = logging.getLogger(__name__)

async def notify_about_new_gossip(
    app: Application,
    author_username: str,
    content: str,
    author_id: str
) -> None:
    """Отправка уведомлений о новой сплетне всем пользователям"""
    logger.info("Начинаю отправку уведомлений о новой сплетне")
    
    # Получаем анонимное имя автора
    author = await db.get_bot_user(author_id)
    if not author:
        logger.error(f"❌ Автор не найден в базе данных (ID: {author_id})")
        return
    
    users = await db.get_all_bot_users()
    logger.info(f"Найдено {len(users)} пользователей для отправки уведомлений")
    
    for user in users:
        # Пропускаем автора сплетни
        if user.id == author_id:
            logger.info(f"Пропускаю отправку уведомления автору {user.anonymousName}")
            continue

        try:
            logger.info(f"Отправляю уведомление пользователю {user.anonymousName} (ID: {user.id}, ChatID: {user.chatId})")
            await app.bot.send_message(
                chat_id=user.chatId,
                text=f"🔥 Новая сплетня от {author.anonymousName}:\n\n{content}",
                parse_mode='HTML'
            )
            logger.info(f"✓ Уведомление успешно отправлено пользователю {user.anonymousName}")
        except (Forbidden, BadRequest) as e:
            logger.error(f"❌ Ошибка отправки уведомления пользователю {user.anonymousName} (ID: {user.id}): {e}")
        except Exception as e:
            logger.error(f"❌ Неожиданная ошибка при отправке уведомления пользователю {user.anonymousName}: {e}")

async def notify_about_new_comment(
    app: Application,
    gossip_author_id: str,
    comment_author_username: str,
    gossip_content: str,
    comment_content: str
) -> None:
    """Отправка уведомления о новом комментарии автору сплетни"""
    try:
        # Получаем данные авторов
        gossip_author = await db.get_bot_user(gossip_author_id)
        if not gossip_author:
            logger.warning(f"Автор сплетни не найден (ID: {gossip_author_id})")
            return

        # Получаем анонимное имя автора комментария напрямую из параметра
        comment_author_name = comment_author_username

        # Форматируем текст сплетни (первые 4 слова + ...)
        words = gossip_content.split()
        formatted_gossip = ' '.join(words[:4])
        if len(words) > 4:
            formatted_gossip += '...'

        logger.info(f"Отправляю уведомление о комментарии автору {gossip_author.anonymousName}")
        await app.bot.send_message(
            chat_id=gossip_author.chatId,
            text=(
                f"💬 Новый комментарий от {comment_author_name} на вашу сплетню:\n\n"
                f"Ваша сплетня: {formatted_gossip}\n\n"
                f"Комментарий: {comment_content}"
            ),
            parse_mode='HTML'
        )
        logger.info(f"✓ Уведомление о комментарии успешно отправлено {gossip_author.anonymousName}")
    except Exception as e:
        logger.error(f"❌ Ошибка отправки уведомления о комментарии: {e}") 