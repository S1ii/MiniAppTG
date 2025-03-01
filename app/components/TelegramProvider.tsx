'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';

interface TelegramUser {
  id: string;
  first_name: string;
  username?: string;
  language_code?: string;
}

interface TelegramContextType {
  user: TelegramUser | null;
  isLoading: boolean;
  telegram: typeof WebApp | null;
}

const TelegramContext = createContext<TelegramContextType>({
  user: null,
  isLoading: true,
  telegram: null,
});

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [telegram, setTelegram] = useState<typeof WebApp | null>(null);

  useEffect(() => {
    const initTelegram = async () => {
      try {
        // Ждем готовности WebApp
        WebApp.ready();

        // Получаем данные пользователя
        const initData = WebApp.initDataUnsafe;
        if (!initData.user) {
          throw new Error('No user data available');
        }

        // Настраиваем внешний вид
        WebApp.setHeaderColor(WebApp.themeParams.bg_color);
        
        // Включаем подтверждение закрытия на мобильных устройствах
        if (WebApp.platform === 'android' || WebApp.platform === 'ios') {
          WebApp.enableClosingConfirmation();
        }

        // Настраиваем основную тему
        const root = document.documentElement;
        const isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Устанавливаем тему через data-theme атрибут
        root.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');

        // Слушаем изменения темы
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
          root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        });

        setTelegram(WebApp);
        setUser({
          id: initData.user.id.toString(),
          first_name: initData.user.first_name,
          username: initData.user.username,
          language_code: initData.user.language_code
        });
      } catch (error) {
        console.error('Failed to initialize Telegram Mini App:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initTelegram();
  }, []);

  return (
    <TelegramContext.Provider value={{ user, isLoading, telegram }}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  const context = useContext(TelegramContext);
  if (context === undefined) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
} 