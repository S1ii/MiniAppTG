'use client';

import { createContext, useContext, useEffect, useState } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        initDataUnsafe: {
          user?: {
            id: number;
            username: string;
            first_name?: string;
            last_name?: string;
          };
        };
      };
    };
  }
}

interface TelegramUser {
  id: number;
  username?: string;
  first_name: string;
  last_name?: string;
}

interface TelegramContext {
  user: TelegramUser | null;
  isLoading: boolean;
}

const TelegramContext = createContext<TelegramContext>({ user: null, isLoading: true });

export function useTelegram() {
  return useContext(TelegramContext);
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initTelegram = () => {
      if (typeof window !== 'undefined' && window.Telegram) {
        const tg = window.Telegram.WebApp;

        // Проверяем, что приложение запущено в правильном контексте
        if (!tg.initDataUnsafe || !tg.initDataUnsafe.user) {
          // Перенаправляем пользователя на бота
          window.location.href = 'https://t.me/t3st1k_bot/gossip';
          return;
        }

        tg.ready();
        
        if (tg.initDataUnsafe.user) {
          const telegramUser = tg.initDataUnsafe.user;
          const user: TelegramUser = {
            id: telegramUser.id,
            username: telegramUser.username,
            first_name: telegramUser.first_name || 'Аноним',
            last_name: telegramUser.last_name
          };
          setUser(user);
        }
      }
      setIsLoading(false);
    };

    // Проверяем, загружен ли уже скрипт
    if (typeof window !== 'undefined' && window.Telegram) {
      initTelegram();
    } else {
      // Если скрипт еще не загружен, ждем его загрузки
      const interval = setInterval(() => {
        if (typeof window !== 'undefined' && window.Telegram) {
          clearInterval(interval);
          initTelegram();
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, []);

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  return (
    <TelegramContext.Provider value={{ user, isLoading }}>
      {children}
    </TelegramContext.Provider>
  );
} 