import { useEffect } from 'react';
import { notificationService, WebhookPayload } from '../lib/notificationService';
import { api } from '../lib/api/client';

/**
 * Хук для прослушивания уведомлений от Telegram Bot API и синхронизации Telegram ID.
 * Сохраняет telegram_id клиента при каждом открытии мини-аппа в Telegram.
 */
export const useTelegramNotifications = () => {
  useEffect(() => {
    if (!window.Telegram?.WebApp) {
      return;
    }

    const tg = window.Telegram.WebApp;
    const telegramId: number | undefined = tg.initDataUnsafe?.user?.id;

    // Sync Telegram ID on every app open if authenticated
    if (telegramId) {
      const token = (() => { try { return localStorage.getItem('yookie_auth_token'); } catch { return null; } })();
      if (token) {
        api.post('/auth/sync-telegram', { telegramId }).catch(() => {});
      }
    }

    const handleBotMessage = (event: any) => {
      try {
        const payload: WebhookPayload = JSON.parse(event.data);
        if (payload.type && payload.data) {
          notificationService.handleEvent(payload);
        }
      } catch {
        // non-webhook message, ignore
      }
    };

    tg.onEvent('message_received', handleBotMessage as () => void);
    return () => { tg.offEvent('message_received', handleBotMessage as () => void); };
  }, []);

  return null;
};
