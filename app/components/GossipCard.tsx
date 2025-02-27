'use client';

import { useState, useEffect } from 'react';
import { GossipWithComments } from '../types/gossip';
import { useTelegram } from './TelegramProvider';
import CountdownTimer from './CountdownTimer';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { FaRegCommentDots } from 'react-icons/fa';

interface Comment {
  id: string;
  content: string;
  authorUsername: string;
  createdAt: string | Date;
}

interface GossipCardProps {
  gossip: {
    id: string;
    content: string;
    authorUsername: string;
    createdAt: string | Date;
    likes: number;
    comments: Comment[];
    likedBy: Array<{ userId: string }>;
  };
  onLike: (id: string) => void;
  onComment: (id: string, comment: string) => void;
  isLiked: boolean;
}

export default function GossipCard({ gossip, onLike, onComment, isLiked }: GossipCardProps) {
  const [comment, setComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [isCommentCooldown, setIsCommentCooldown] = useState(false);
  const { user } = useTelegram();

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
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  // Обработчик нажатия на кнопку комментариев
  const handleCommentsToggle = () => {
    vibrate([30, 20, 15]); // Паттерн вибрации: 30мс вибрация, 20мс пауза, 15мс вибрация
    setShowComments(!showComments);
  };

  // Обработчик нажатия на кнопку лайка
  const handleLike = () => {
    vibrate([20, 15, 30]); // Другой паттерн вибрации для лайка
    onLike(gossip.id);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim() && !isCommentCooldown) {
      onComment(gossip.id, comment);
      setComment('');
      setIsCommentCooldown(true);
    }
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

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm font-bold bg-[rgb(var(--accent-light))] text-[rgb(var(--accent-color))] px-2 py-0.5 rounded-full">
          {gossip.authorUsername}
        </span>
        <span className="text-xs text-[rgb(var(--text-secondary))]">
          {formatDate(gossip.createdAt)}
        </span>
      </div>

      <p className="text-[rgb(var(--text-primary))] mb-4">{gossip.content}</p>

      <div className="flex items-center gap-6">
        <button
          onClick={handleLike}
          className="flex items-center gap-2 text-sm hover:text-[rgb(var(--accent-color))] transition-colors"
        >
          {isLiked ? (
            <AiFillHeart className="w-6 h-6 text-[rgb(var(--accent-color))]" />
          ) : (
            <AiOutlineHeart className="w-6 h-6" />
          )}
          <span>{gossip.likes}</span>
        </button>

        <button
          onClick={handleCommentsToggle}
          className="flex items-center gap-2 text-sm hover:text-[rgb(var(--accent-color))] transition-colors"
        >
          <FaRegCommentDots className={`w-6 h-6 ${showComments ? 'text-[rgb(var(--accent-color))]' : ''}`} />
          <span>{gossip.comments.length}</span>
        </button>
      </div>

      {showComments && (
        <div className="comments-container" data-visible={showComments}>
          <div className="mt-4 sm:mt-6">
            <form onSubmit={handleSubmitComment} className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={isCommentCooldown ? "Подождите 5 секунд..." : "Написать комментарий..."}
                disabled={isCommentCooldown}
                className="input-primary flex-1"
              />
              <button
                type="submit"
                disabled={isCommentCooldown || !comment.trim()}
                className="btn-primary whitespace-nowrap w-full sm:w-auto"
              >
                {isCommentCooldown ? (
                  <span className="flex items-center justify-center gap-1">
                    <CountdownTimer seconds={5} onComplete={() => setIsCommentCooldown(false)} /> сек
                  </span>
                ) : (
                  'ОТПРАВИТЬ'
                )}
              </button>
            </form>

            <div className="space-y-3 sm:space-y-4">
              {gossip.comments.map((comment) => (
                <div key={comment.id} className="card p-3 sm:p-4 bg-[rgb(var(--background-start-rgb))] bg-opacity-50">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <span className="text-sm font-bold bg-[rgb(var(--accent-light))] text-[rgb(var(--accent-color))] px-2 py-0.5 rounded-full">
                      {comment.authorUsername}
                    </span>
                    <span className="text-xs text-[rgb(var(--text-secondary))]">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-[rgb(var(--text-primary))] text-sm sm:text-base">{comment.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 