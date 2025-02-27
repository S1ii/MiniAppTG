export interface Like {
  userId: string;
  createdAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  author: {
    id: number;
    username: string;
  };
  createdAt: Date;
}

export interface Gossip {
  id: string;
  content: string;
  author: {
    id: number;
    username: string;
  };
  createdAt: Date;
  likedBy: Like[];
}

export interface GossipWithComments extends Gossip {
  comments: Comment[];
} 