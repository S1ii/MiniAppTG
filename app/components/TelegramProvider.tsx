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
          // Показываем сообщение об ошибке и кнопку для перехода в бота
          const botUsername = 'GossipMiniAppBot'; // Имя вашего бота
          const errorContainer = document.createElement('div');
          errorContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 90%;
            width: 300px;
          `;
          errorContainer.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #333;">Ошибка запуска</h3>
            <p style="margin: 0 0 20px 0; color: #666;">Пожалуйста, откройте это приложение через Telegram бота</p>
            <a href="https://t.me/${botUsername}" style="
              display: inline-block;
              background: #0088cc;
              color: white;
              text-decoration: none;
              padding: 10px 20px;
              border-radius: 5px;
              font-weight: 500;
            ">Открыть бота</a>
          `;
          document.body.appendChild(errorContainer);
          setIsLoading(false);
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