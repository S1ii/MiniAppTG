import { Gossip, Comment, Like } from '@prisma/client';

export type GossipWithComments = Gossip & {
  comments: Comment[];
  likedBy: Like[];
}; 