'use client';

import { useState, useEffect, useRef } from 'react';
import { useTelegram } from './components/TelegramProvider';
import ThemeToggle from './components/ThemeToggle';
import GossipCard from './components/GossipCard';
import CountdownTimer from './components/CountdownTimer';
import { GossipWithComments } from './types/gossip';
import { TelegramProvider } from './components/TelegramProvider';

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center my-4">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[rgb(var(--accent-color))]"></div>
    </div>
  );
}

function GossipApp() {
  const [gossips, setGossips] = useState<GossipWithComments[]>([]);
  const [newGossip, setNewGossip] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [isGossipCooldown, setIsGossipCooldown] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { user, telegram } = useTelegram();

  useEffect(() => {
    fetchGossips();
    
    // Устанавливаем интервал для автоматического обновления сплетен каждые 30 секунд
    refreshIntervalRef.current = setInterval(() => {
      fetchGossips(true);
    }, 30000);
    
    // Очищаем интервал при размонтировании компонента
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const fetchGossips = async (isAutoRefresh = false) => {
    try {
      if (isAutoRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setIsError(false);
      
      const response = await fetch('/api/gossips');
      
      if (!response.ok) {
        throw new Error('Failed to fetch gossips');
      }
      
      const data = await response.json();
      
      // Сортируем сплетни по дате, новые сверху
      const sortedGossips = data.sort((a: GossipWithComments, b: GossipWithComments) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setGossips(sortedGossips);
      
      // Если это автоматическое обновление и есть новые сплетни, показываем уведомление
      if (isAutoRefresh && sortedGossips.length > gossips.length) {
        const newGossipsCount = sortedGossips.length - gossips.length;
        if (telegram) {
          telegram.HapticFeedback.notificationOccurred('success');
        }
        // Можно добавить визуальное уведомление о новых сплетнях
      }
    } catch (error) {
      console.error('Error fetching gossips:', error);
      setIsError(true);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Неизвестная ошибка');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSubmitGossip = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Для отправки сплетни необходимо авторизоваться');
      return;
    }
    
    if (newGossip.trim().length < 20) {
      alert('Сплетня должна содержать минимум 20 символов');
      return;
    }
    
    try {
      const response = await fetch('/api/gossips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle.trim() || null,
          content: newGossip,
          author: {
            id: user.id,
            username: user.username || user.first_name,
          },
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        setErrorMessage(data.error || 'Ошибка отправки сплетни');
        return;
      }
      
      setNewGossip('');
      setNewTitle('');
      setCharCount(0);
      setIsGossipCooldown(true);
      
      // Обновляем список сплетен
      fetchGossips();
      
      if (telegram) {
        telegram.HapticFeedback.notificationOccurred('success');
      }
    } catch (error) {
      console.error('Error posting gossip:', error);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Неизвестная ошибка при отправке сплетни');
      }
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

  const handleComment = async (gossipId: string, comment: string, parentId?: string) => {
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
          parentId: parentId
        }),
      });

      if (response.ok) {
        const updatedGossip = await response.json();
        // Обновляем только конкретную сплетню в состоянии
        setGossips(prevGossips => 
          prevGossips.map(gossip => 
            gossip.id === gossipId ? updatedGossip : gossip
          )
        );
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
    console.log('Showing loading spinner');
    return <LoadingSpinner />;
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl min-h-screen">
      <ThemeToggle />
      
      <div className="mb-8 text-center animate-fade-in">
        <h1 className="text-3xl font-bold mb-2 text-[rgb(var(--accent-color))] font-['Tektur'] highlight-glow">
          СПЛЕТНИК
        </h1>
        <p className="text-[rgb(var(--text-secondary))] mb-4">
          Поделитесь анонимно своими мыслями и сплетнями!
        </p>
      </div>
      
      <div className="card p-4 sm:p-8 mb-6 sm:mb-12 animate-fade-in" style={{animationDelay: '100ms'}}>
        <form onSubmit={handleSubmitGossip}>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Заголовок (необязательно)"
            disabled={isGossipCooldown}
            className="w-full p-4 rounded-xl bg-[rgb(var(--background-start-rgb))] text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-secondary))] border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-[rgb(var(--accent-color))] focus:ring-2 focus:ring-[rgb(var(--accent-color))] focus:ring-opacity-20 mb-3 sm:mb-4 transition-all duration-300"
          />
          
          <textarea
            value={newGossip}
            onChange={(e) => {
              setNewGossip(e.target.value);
              setCharCount(e.target.value.length);
            }}
            placeholder="Поделитесь сплетней... (поддерживается Markdown-разметка)"
            disabled={isGossipCooldown}
            className="w-full p-4 rounded-xl bg-[rgb(var(--background-start-rgb))] text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-secondary))] border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-[rgb(var(--accent-color))] focus:ring-2 focus:ring-[rgb(var(--accent-color))] focus:ring-opacity-20 mb-3 sm:mb-4 transition-all duration-300"
            rows={5}
          />
          <div className="flex justify-between items-center text-[rgb(var(--text-secondary))] text-sm mb-3">
            <div>
              {charCount}/1000 символов
            </div>
            {charCount < 20 && (
              <div>
                Осталось: {20 - charCount}
              </div>
            )}
          </div>
          {errorMessage && (
            <div className="text-red-500 text-sm mb-3">{errorMessage}</div>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isGossipCooldown || !newGossip.trim() || charCount < 20}
              className="btn-primary relative overflow-hidden highlight-glow"
            >
              {isGossipCooldown ? (
                <span className="flex items-center justify-center gap-1">
                  Подождите <CountdownTimer seconds={60} onComplete={() => setIsGossipCooldown(false)} /> сек
                </span>
              ) : (
                <span className="relative z-10">ОПУБЛИКОВАТЬ</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {isRefreshing && (
        <div className="text-center py-2 text-[rgb(var(--accent-color))] animate-pulse">
          Обновление...
        </div>
      )}

      <div className="space-y-6">
        {isError ? (
          <div className="text-center py-10 text-[rgb(var(--accent-color))]">
            <p>Ошибка загрузки: {errorMessage}</p>
            <button 
              onClick={() => fetchGossips()}
              className="mt-4 px-4 py-2 bg-[rgb(var(--accent-color))] text-white rounded-lg highlight-glow transition-all duration-300 hover:scale-105"
            >
              Попробовать снова
            </button>
          </div>
        ) : gossips.length === 0 ? (
          <div className="text-center py-10 text-[rgb(var(--text-secondary))] card p-8 animate-pulse">
            <p>Пока нет сплетен</p>
          </div>
        ) : (
          gossips.map((gossip, index) => (
            <div key={gossip.id} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <GossipCard
                gossip={gossip}
                onLike={handleLike}
                onComment={handleComment}
                isLiked={gossip.likedBy?.some(like => like.userId === user?.id?.toString()) || false}
              />
            </div>
          ))
        )}
      </div>
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