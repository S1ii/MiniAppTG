import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { validateMessage, checkMessageFrequency } from '../../../../../lib/messageValidation';

// Функция для отправки уведомления о комментарии через Python-сервер
async function sendCommentNotification(
  gossipAuthorId: string | bigint,
  commentAuthorId: string,
  gossipContent: string,
  commentContent: string
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
        comment_content: commentContent
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

    const comment = await prisma.comment.create({
      data: {
        content: body.content,
        authorId: authorId,
        authorUsername: botUser.anonymousName,
        gossipId: params.id
      }
    });

    // Отправляем уведомление через Python-сервер
    await sendCommentNotification(
      gossip.authorId,
      authorId,
      gossip.content,
      body.content
    );

    // Получаем обновленную сплетню со всеми комментариями
    const updatedGossip = await prisma.gossip.findUnique({
      where: { id: params.id },
      include: {
        comments: true,
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