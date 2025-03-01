import { Gossip, Comment as PrismaComment, Like } from '@prisma/client';

// Расширяем тип Comment из Prisma
export interface Comment extends PrismaComment {
  parentId: string | null;
  level: number;
  replies?: Comment[];
}

export type GossipWithComments = Gossip & {
  title?: string;
  comments: Comment[];
  likedBy: Like[];
}; 