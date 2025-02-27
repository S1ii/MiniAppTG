import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { validateMessage, checkMessageFrequency } from '../../../lib/messageValidation';

// Функция для отправки уведомления через Python-сервер
async function sendNotification(authorUsername: string, authorId: string | bigint, content: string) {
  try {
    // Преобразуем ID в строку, если это BigInt
    const authorIdStr = typeof authorId === 'bigint' ? authorId.toString() : authorId;

    const response = await fetch('http://localhost:3001/notify/gossip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        author_username: authorUsername,
        author_id: authorIdStr,
        content: content
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Error from notification server:', error);
    }
  } catch (error) {
    console.error('Error sending notification:', error);
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

export async function GET() {
  try {
    const gossips = await prisma.gossip.findMany({
      include: {
        comments: true,
        likedBy: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(gossips);
  } catch (error) {
    console.error('Error fetching gossips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gossips' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.author?.id) {
      return NextResponse.json(
        { error: 'Author ID is required' },
        { status: 400 }
      );
    }

    // Проверка содержимого сообщения
    const messageValidation = validateMessage(body.content);
    if (!messageValidation.isValid) {
      return NextResponse.json(
        { error: messageValidation.error },
        { status: 400 }
      );
    }

    // Проверка частоты сообщений
    const frequencyValidation = checkMessageFrequency(body.author.id, body.content);
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

    // Получаем анонимное имя из базы данных через Python API
    const botUserResponse = await fetch(`http://localhost:3001/bot_user/${authorId}`);
    if (!botUserResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to get bot user info' },
        { status: 500 }
      );
    }
    const botUser = await botUserResponse.json();

    const newGossip = await prisma.gossip.create({
      data: {
        content: body.content,
        authorId: authorId,
        authorUsername: botUser.anonymousName
      },
      include: {
        comments: true,
        likedBy: true
      }
    });

    // Отправляем уведомление через Python-сервер
    await sendNotification(botUser.anonymousName, authorId, body.content);

    return NextResponse.json(newGossip, { status: 201 });
  } catch (error) {
    console.error('Error creating gossip:', error);
    return NextResponse.json(
      { error: 'Failed to create gossip' },
      { status: 500 }
    );
  }
} 