'use client';

import { useState, useEffect } from 'react';
import { GossipWithComments } from '../types/gossip';
import { useTelegram } from './TelegramProvider';
import CountdownTimer from './CountdownTimer';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { FaRegCommentDots } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';
import { FaReply } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

interface Comment {
  id: string;
  content: string;
  authorUsername: string;
  createdAt: string | Date;
  parentId: string | null;
  level: number;
  replies?: Comment[];
}

interface GossipCardProps {
  gossip: {
    id: string;
    title?: string;
    content: string;
    authorUsername: string;
    createdAt: string | Date;
    likes: number;
    comments: Comment[];
    likedBy: Array<{ userId: string }>;
  };
  onLike: (id: string) => void;
  onComment: (id: string, comment: string, parentId?: string) => void;
  isLiked: boolean;
}

export default function GossipCard({ gossip, onLike, onComment, isLiked }: GossipCardProps) {
  const [comment, setComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [isCommentCooldown, setIsCommentCooldown] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { user, telegram } = useTelegram();

  // Отладочное логирование
  useEffect(() => {
    console.log('Gossip data:', {
      id: gossip.id,
      createdAt: gossip.createdAt,
      type: typeof gossip.createdAt
    });
    console.log('Comments data:', gossip.comments.map(c => ({
      id: c.id,
      createdAt: c.createdAt,
      type: typeof c.createdAt
    })));
  }, [gossip]);

  // Функция для создания вибрации
  const vibrate = (pattern: number[]) => {
    if (telegram?.platform === 'android' || telegram?.platform === 'ios') {
      telegram.HapticFeedback.impactOccurred('medium');
    }
  };

  // Обработчик нажатия на кнопку комментариев
  const handleCommentsToggle = () => {
    vibrate([30, 20, 15]);
    setShowComments(!showComments);
  };

  // Обработчик нажатия на кнопку лайка
  const handleLike = () => {
    vibrate([20, 15, 30]);
    onLike(gossip.id);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      onComment(gossip.id, comment, replyingTo || undefined);
      setComment('');
      setReplyingTo(null);
    }
  };

  const handleReply = (commentId: string) => {
    vibrate([15, 10, 15]);
    setReplyingTo(commentId);
    setShowComments(true);
    // Прокручиваем к полю ввода
    setTimeout(() => {
      const inputElement = document.getElementById('comment-input');
      if (inputElement) {
        inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        inputElement.focus();
      }
    }, 100);
  };

  const formatDate = (date: string | Date) => {
    try {
      let dateObject = typeof date === 'string' ? new Date(date) : date;
      
      if (isNaN(dateObject.getTime())) {
        console.error('Invalid date:', date);
        return 'Некорректная дата';
      }

      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObject);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Некорректная дата';
    }
  };

  // Функция для организации комментариев в древовидную структуру
  const organizeComments = (comments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // Сначала создаем Map всех комментариев
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Затем организуем их в дерево
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          if (!parent.replies) parent.replies = [];
          parent.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  };

  // Компонент для рекурсивного рендеринга комментариев
  const CommentItem = ({ comment, level }: { comment: Comment; level: number }) => (
    <div className={`comment-wrapper mt-2 ${level > 0 ? 'ml-6 relative' : ''}`}>
      {level > 0 && (
        <div className="connect-line" />
      )}
      <div className="comment relative">
        <div className="flex items-center gap-2 relative w-full">
          <div className="avatar-accent flex items-center justify-center w-8 h-8 rounded-lg bg-[rgba(var(--accent-color),0.1)] shrink-0">
            <span className="text-sm font-bold text-[rgb(var(--accent-color))]">
              {comment.authorUsername.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-[rgb(var(--accent-color))] truncate">
              {comment.authorUsername}
            </span>
            <span className="text-xs text-[rgb(var(--text-secondary))]">
              {formatDate(comment.createdAt)}
            </span>
          </div>
          {level < 3 && (
            <button
              onClick={() => handleReply(comment.id)}
              className="reply-button highlight-glow ml-auto"
              aria-label="Ответить"
            >
              <FaReply className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <p className="text-sm leading-relaxed text-[rgb(var(--text-primary))] pl-10 mt-2 break-words">{comment.content}</p>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="replies-container pl-2 relative ml-4">
          <div className="thread-line"></div>
          <div className="space-y-1">
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} level={level + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-3 w-full">
          <div className="avatar-accent flex items-center justify-center w-10 h-10 rounded-xl bg-[rgba(var(--accent-color),0.1)] border-2 border-[rgb(var(--border-color))] shrink-0">
            <span className="text-base font-bold text-[rgb(var(--accent-color))]">
              {gossip.authorUsername.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-[rgb(var(--accent-color))] truncate">
              {gossip.authorUsername}
            </span>
            <span className="text-xs text-[rgb(var(--text-secondary))]">
              {formatDate(gossip.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {gossip.title && (
        <h2 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-2 pl-[3.25rem]">{gossip.title}</h2>
      )}

      <div className="text-[rgb(var(--text-primary))] mb-4 leading-relaxed pl-[3.25rem] prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown>{gossip.content}</ReactMarkdown>
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={handleLike}
          className="highlight-glow flex items-center gap-2 text-sm hover:text-[rgb(var(--accent-color))] transition-colors group"
        >
          {isLiked ? (
            <AiFillHeart className="w-5 h-5 text-[rgb(var(--accent-color))]" />
          ) : (
            <AiOutlineHeart className="w-5 h-5 text-[rgb(var(--text-secondary))] group-hover:text-[rgb(var(--accent-color))]" />
          )}
          <span className="text-[rgb(var(--text-secondary))] group-hover:text-[rgb(var(--accent-color))]">{gossip.likes}</span>
        </button>

        <button
          onClick={handleCommentsToggle}
          className="highlight-glow flex items-center gap-2 text-sm hover:text-[rgb(var(--accent-color))] transition-colors group"
        >
          <FaRegCommentDots className={`w-5 h-5 ${showComments ? 'text-[rgb(var(--accent-color))]' : 'text-[rgb(var(--text-secondary))] group-hover:text-[rgb(var(--accent-color))]'}`} />
          <span className={`${showComments ? 'text-[rgb(var(--accent-color))]' : 'text-[rgb(var(--text-secondary))] group-hover:text-[rgb(var(--accent-color))]'}`}>
            {gossip.comments.length}
          </span>
        </button>
      </div>

      {showComments && (
        <div className="comments-container mt-4" data-visible={showComments}>
          <div className="mb-4">
            <form onSubmit={handleSubmitComment} className="flex flex-col gap-2">
              <div className="relative">
                <input
                  id="comment-input"
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={replyingTo ? "Написать ответ..." : "Написать комментарий..."}
                  disabled={isCommentCooldown}
                  className="w-full pr-12 p-3 rounded-xl bg-[rgb(var(--background-start-rgb))] text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-secondary))] border border-gray-200 focus:outline-none focus:border-[rgb(var(--accent-color))] focus:ring-2 focus:ring-[rgb(var(--accent-color))] focus:ring-opacity-20"
                />
                {replyingTo && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-8 h-8">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReplyingTo(null);
                      }}
                      className="highlight-glow p-1.5 rounded-full hover:bg-[rgba(var(--accent-color),0.1)] transition-colors"
                    >
                      <IoMdClose className="w-5 h-5 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--accent-color))]" />
                    </button>
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={!comment.trim()}
                className="btn-primary self-end bg-[rgb(var(--accent-color))] text-[rgb(var(--accent-text))] px-4 py-2 rounded-xl disabled:opacity-50 hover:bg-[rgb(var(--accent-color))] hover:opacity-90 transition-all shadow-sm"
              >
                Отправить
              </button>
            </form>
          </div>

          <div className="space-y-1 mt-4">
            {organizeComments(gossip.comments).map(comment => (
              <CommentItem key={comment.id} comment={comment} level={0} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 