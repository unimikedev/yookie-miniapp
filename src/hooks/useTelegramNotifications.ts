import { useEffect } from 'react';
import { notificationService, WebhookPayload } from '../lib/notificationService';

/**
 * Хук для прослушивания уведомлений от Telegram Bot API
 * Подписывается на сообщения бота и обрабатывает webhook события
 */
export const useTelegramNotifications = () => {
  useEffect(() => {
    // Проверяем, что мы внутри Telegram
    if (!window.Telegram?.WebApp) {
      console.log('[useTelegramNotifications] Not running in Telegram');
      return;
    }

    const tg = window.Telegram.WebApp;

    // Обработчик сообщений от бота (вебхуки приходят как сообщения)
    const handleBotMessage = (event: any) => {
      try {
        // Пытаемся распарсить данные вебхука из сообщения
        // Формат: { type: 'booking-created', data: {...}, timestamp: 1234567890 }
        const payload: WebhookPayload = JSON.parse(event.data);
        
        if (payload.type && payload.data) {
          notificationService.handleEvent(payload);
        }
      } catch (error) {
        // Если не удалось распарсить, игнорируем (это может быть обычное сообщение)
        console.log('[useTelegramNotifications] Non-webhook message received');
      }
    };

    // Подписываемся на события от Telegram WebApp
    tg.onEvent('message_received', handleBotMessage);

    // Для тестирования также слушаем mainButtonPressed (можно триггерить вручную)
    tg.onEvent('mainButtonClicked', () => {
      console.log('[useTelegramNotifications] Main button clicked - checking for updates');
      // Принудительная проверка обновлений
    });

    return () => {
      // Отписываемся при размонтировании
      tg.offEvent('message_received', handleBotMessage);
      tg.offEvent('mainButtonClicked', () => {});
    };
  }, []);

  return null;
};
