import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    
    // Убедимся, что ID всегда строка
    const userId = typeof body.userId === 'string'
      ? body.userId
      : body.userId.toString();

    // Проверяем, существует ли уже лайк
    const existingLike = await prisma.like.findFirst({
      where: {
        userId: userId,
        gossipId: params.id
      }
    });

    let updatedGossip;

    if (existingLike) {
      // Если лайк существует, удаляем его
      await prisma.like.delete({
        where: {
          id: existingLike.id
        }
      });

      updatedGossip = await prisma.gossip.update({
        where: { id: params.id },
        data: {
          likes: {
            decrement: 1
          }
        },
        include: {
          likedBy: true,
          comments: true
        }
      });
    } else {
      // Если лайка нет, создаем новый
      updatedGossip = await prisma.gossip.update({
        where: { id: params.id },
        data: {
          likes: {
            increment: 1
          },
          likedBy: {
            create: {
              userId: userId
            }
          }
        },
        include: {
          likedBy: true,
          comments: true
        }
      });
    }

    return NextResponse.json(updatedGossip);
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
} 