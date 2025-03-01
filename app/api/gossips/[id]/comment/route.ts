import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { validateMessage, checkMessageFrequency } from '../../../../../lib/messageValidation';

// Функция для отправки уведомления о комментарии через Python-сервер
async function sendCommentNotification(
  gossipAuthorId: string | bigint,
  commentAuthorId: string,
  gossipContent: string,
  commentContent: string,
  parentComment?: { content: string; authorUsername: string } | null
) {
  try {
    // Получаем анонимное имя автора комментария
    const botUserResponse = await fetch(`http://localhost:3001/bot_user/${commentAuthorId}`);
    if (!botUserResponse.ok) {
      console.error('Failed to get comment author info');
      return;
    }
    const botUser = await botUserResponse.json();

    // Преобразуем ID в строку, если это BigInt
    const gossipAuthorIdStr = typeof gossipAuthorId === 'bigint' ? gossipAuthorId.toString() : gossipAuthorId;

    const response = await fetch('http://localhost:3001/notify/comment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gossip_author_id: gossipAuthorIdStr,
        comment_author_username: botUser.anonymousName,
        gossip_content: gossipContent,
        comment_content: commentContent,
        parent_comment_content: parentComment?.content || null,
        parent_comment_author: parentComment?.authorUsername || null
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Error from notification server:', error);
    }
  } catch (error) {
    console.error('Error sending comment notification:', error);
  }
}

// Функция для отправки уведомления о ответе на комментарий через Python-сервер
async function sendCommentReplyNotification(
  parentCommentAuthorId: string | bigint,
  commentAuthorId: string,
  gossipContent: string,
  commentContent: string,
  parentCommentContent: string
) {
  try {
    // Получаем анонимное имя автора комментария
    const botUserResponse = await fetch(`http://localhost:3001/bot_user/${commentAuthorId}`);
    if (!botUserResponse.ok) {
      console.error('Failed to get comment author info');
      return;
    }
    const botUser = await botUserResponse.json();

    // Преобразуем ID в строку, если это BigInt
    const parentAuthorIdStr = typeof parentCommentAuthorId === 'bigint' 
      ? parentCommentAuthorId.toString() 
      : parentCommentAuthorId;

    const response = await fetch('http://localhost:3001/notify/comment_reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent_comment_author_id: parentAuthorIdStr,
        comment_author_username: botUser.anonymousName,
        gossip_content: gossipContent,
        comment_content: commentContent,
        parent_comment_content: parentCommentContent
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Error from notification server:', error);
    }
  } catch (error) {
    console.error('Error sending comment reply notification:', error);
  }
}

// Функция для преобразования BigInt в строку в объекте
function convertBigIntToString(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  }

  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      converted[key] = convertBigIntToString(obj[key]);
    }
    return converted;
  }

  return obj;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Проверяем существование сплетни
    const gossip = await prisma.gossip.findUnique({
      where: { id: params.id }
    });

    if (!gossip) {
      return NextResponse.json(
        { error: 'Gossip not found' },
        { status: 404 }
      );
    }

    // Проверка содержимого комментария
    const messageValidation = validateMessage(body.content, true);
    if (!messageValidation.isValid) {
      return NextResponse.json(
        { error: messageValidation.error },
        { status: 400 }
      );
    }

    // Проверка частоты комментариев
    const frequencyValidation = checkMessageFrequency(body.author.id, body.content, true);
    if (!frequencyValidation.isValid) {
      return NextResponse.json(
        { error: frequencyValidation.error },
        { status: 429 }
      );
    }

    // Убедимся, что ID всегда строка
    const authorId = typeof body.author.id === 'string'
      ? body.author.id
      : body.author.id.toString();

    // Получаем анонимное имя автора комментария
    const botUserResponse = await fetch(`http://localhost:3001/bot_user/${authorId}`);
    if (!botUserResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to get bot user info' },
        { status: 500 }
      );
    }
    const botUser = await botUserResponse.json();

    /* Добавляю проверку для вложенных комментариев */
    let level = 0;
    if (body.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: body.parentId }
      });
      if (!parentComment) {
        return NextResponse.json({ error: 'Родительский комментарий не найден' }, { status: 404 });
      }
      if ((parentComment as any).level >= 3) {
        return NextResponse.json({ error: 'Достигнута максимальная вложенность комментариев' }, { status: 400 });
      }
      level = (parentComment as any).level + 1;
    }

    const comment = await prisma.comment.create({
      data: {
        content: body.content,
        authorId: authorId,
        authorUsername: botUser.anonymousName,
        gossipId: params.id,
        parentId: body.parentId || null,
        level: level
      } as any
    });

    // Получаем информацию о родительском комментарии, если есть
    let parentCommentInfo = null;
    if (body.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: body.parentId },
        select: {
          content: true,
          authorUsername: true,
          authorId: true
        }
      });
      if (parentComment) {
        parentCommentInfo = parentComment;
      }
    }

    // Отправляем уведомление автору сплетни через Python-сервер
    await sendCommentNotification(
      gossip.authorId,
      authorId,
      gossip.content,
      body.content,
      parentCommentInfo
    );

    // Если это ответ на комментарий, отправляем уведомление автору родительского комментария
    if (parentCommentInfo && parentCommentInfo.authorId !== authorId && parentCommentInfo.authorId !== gossip.authorId) {
      await sendCommentReplyNotification(
        parentCommentInfo.authorId,
        authorId,
        gossip.content,
        body.content,
        parentCommentInfo.content
      );
    }

    // Получаем обновленную сплетню со всеми комментариями
    const updatedGossip = await prisma.gossip.findUnique({
      where: { id: params.id },
      include: {
        comments: {
          include: {
            parent: true,
            replies: {
              include: {
                replies: true
              }
            }
          }
        },
        likedBy: true
      }
    });

    return NextResponse.json(updatedGossip);
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
} 