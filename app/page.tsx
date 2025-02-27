'use client';

import { useEffect, useState } from 'react';
import GossipCard from './components/GossipCard';
import { GossipWithComments } from './types/gossip';
import { TelegramProvider, useTelegram } from './components/TelegramProvider';
import ThemeToggle from './components/ThemeToggle';
import CountdownTimer from './components/CountdownTimer';

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-telegram"></div>
    </div>
  );
}

function GossipApp() {
  const [gossips, setGossips] = useState<GossipWithComments[]>([]);
  const [newGossip, setNewGossip] = useState('');
  const [isGossipCooldown, setIsGossipCooldown] = useState(false);
  const { user, isLoading } = useTelegram();
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [charCount, setCharCount] = useState(0);
  const [hasReachedMinLength, setHasReachedMinLength] = useState(false);

  // Вычисляем процент заполнения для градиента кнопки
  const buttonFillPercentage = Math.min(100, (charCount / 50) * 100);

  // Функция для создания вибрации
  const vibrate = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      // Создаем паттерн вибрации: вибрация 100мс, пауза 50мс, вибрация 50мс
      navigator.vibrate([100, 50, 50]);
    }
  };

  useEffect(() => {
    // Вибрируем только когда впервые достигнуто минимальное количество символов
    if (charCount >= 50 && !hasReachedMinLength) {
      setHasReachedMinLength(true);
      vibrate();
    } else if (charCount < 50 && hasReachedMinLength) {
      setHasReachedMinLength(false);
    }
  }, [charCount, hasReachedMinLength]);

  const fetchGossips = async () => {
    try {
      const response = await fetch('/api/gossips');
      if (!response.ok) throw new Error('Failed to fetch gossips');
      const data = await response.json();
      setGossips(data);
      setIsError(false);
    } catch (error) {
      console.error('Error fetching gossips:', error);
      setIsError(true);
    }
  };

  useEffect(() => {
    fetchGossips();
    
    // Периодическая синхронизация каждые 5 секунд
    const interval = setInterval(fetchGossips, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleSubmitGossip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGossip.trim() || !user || isGossipCooldown) return;

    try {
      const response = await fetch('/api/gossips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newGossip,
          author: {
            id: user.id,
            username: user.username || user.first_name,
          },
        }),
      });

      if (response.ok) {
        setNewGossip('');
        setIsGossipCooldown(true);
        setErrorMessage('');
        // Обновляем список сплетен сразу после успешной публикации
        fetchGossips();
      } else {
        const data = await response.json();
        setErrorMessage(data.error || 'Произошла ошибка при публикации сплетни');
        if (response.status === 429) {
          setIsGossipCooldown(true);
        }
      }
    } catch (error) {
      console.error('Error creating gossip:', error);
      setErrorMessage('Произошла ошибка при публикации сплетни');
    }
  };

  const handleLike = async (gossipId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/gossips/${gossipId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });
      
      if (response.ok) {
        // Обновляем список сплетен после успешного лайка
        fetchGossips();
      } else {
        console.error('Error liking gossip:', await response.text());
      }
    } catch (error) {
      console.error('Error liking gossip:', error);
    }
  };

  const handleComment = async (gossipId: string, comment: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/gossips/${gossipId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: comment,
          author: {
            id: user.id,
            username: user.username || user.first_name,
          },
        }),
      });

      if (response.ok) {
        // Обновляем список сплетен после успешного комментария
        fetchGossips();
      } else {
        const data = await response.json();
        alert(data.error || 'Произошла ошибка при публикации комментария');
      }
    } catch (error) {
      console.error('Error commenting on gossip:', error);
      alert('Произошла ошибка при публикации комментария');
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
        <p className="text-lg text-[rgb(var(--text-primary))]">Пожалуйста, откройте это приложение через Telegram.</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl min-h-screen">
      <ThemeToggle />
      
      <div className="card p-4 sm:p-8 mb-6 sm:mb-12 animate-fade-in">
        <form onSubmit={handleSubmitGossip}>
          <textarea
            value={newGossip}
            onChange={(e) => {
              setNewGossip(e.target.value);
              setCharCount(e.target.value.length);
            }}
            placeholder={isGossipCooldown ? "Подождите..." : "Поделитесь сплетней..."}
            disabled={isGossipCooldown}
            className="input-primary mb-2 sm:mb-4 w-full"
            rows={3}
          />
          <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
            <div>
              {charCount}/1000 символов
            </div>
            {charCount < 50 && (
              <div>
                Осталось: {50 - charCount}
              </div>
            )}
          </div>
          {errorMessage && (
            <div className="text-red-500 text-sm mb-2">{errorMessage}</div>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isGossipCooldown || !newGossip.trim()}
              className="btn-primary w-full sm:w-auto relative"
              style={{
                opacity: charCount >= 50 ? 1 : 0.7,
                background: buttonFillPercentage < 100 
                  ? `linear-gradient(90deg, 
                      var(--tg-theme-button-color) ${buttonFillPercentage}%, 
                      var(--tg-theme-secondary-bg-color) ${buttonFillPercentage}%)`
                  : undefined
              }}
            >
              {isGossipCooldown ? (
                <span className="flex items-center justify-center gap-1">
                  Подождите <CountdownTimer seconds={60} onComplete={() => setIsGossipCooldown(false)} /> сек
                </span>
              ) : (
                'ОПУБЛИКОВАТЬ'
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-8">
        {gossips.map((gossip, index) => (
          <div key={gossip.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <GossipCard
              gossip={{
                ...gossip,
                authorUsername: gossip.author.username,
                likes: gossip.likedBy.length,
                comments: gossip.comments.map(comment => ({
                  ...comment,
                  authorUsername: comment.author.username
                }))
              }}
              onLike={handleLike}
              onComment={handleComment}
              isLiked={gossip.likedBy?.some(like => like.userId === user?.id?.toString()) || false}
            />
          </div>
        ))}
      </div>

      {isError && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          Ошибка загрузки данных. Пробуем снова...
        </div>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <TelegramProvider>
      <GossipApp />
    </TelegramProvider>
  );
} 