export interface Like {
  userId: string;
}

export interface Author {
  id: number;
  username: string;
}

export interface Comment {
  id: string;
  content: string;
  author: Author;
  authorUsername?: string;
  createdAt: string | Date;
}

export interface Gossip {
  id: string;
  content: string;
  author: Author;
  authorUsername?: string;
  createdAt: string | Date;
  likes?: number;
  likedBy: Like[];
  comments: Comment[];
}

export interface GossipWithComments extends Gossip {} 