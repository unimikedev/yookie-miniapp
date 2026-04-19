import { bookingStore } from '../stores/bookingStore';
import { merchantStore } from '../pro/stores/merchantStore';
import { myBookingsStore } from '../stores/myBookingsStore';

export type NotificationType = 
  | 'booking-created' 
  | 'booking-confirmed' 
  | 'booking-cancelled'
  | 'booking-updated';

export interface WebhookPayload {
  type: NotificationType;
  data: any;
  timestamp: number;
}

/**
 * Сервис обработки входящих уведомлений от бэкенда/вебхуков
 * Используется для realtime синхронизации состояния между B2C и B2B
 */
export const notificationService = {
  /**
   * Обрабатывает входящее событие от вебхука
   * Вызывается из корневого компонента при получении сообщения от Telegram Bot API
   */
  handleEvent: (payload: WebhookPayload) => {
    console.log('[NotificationService] Received event:', payload);

    switch (payload.type) {
      case 'booking-created':
        notificationService.handleBookingCreated(payload.data);
        break;
      case 'booking-confirmed':
        notificationService.handleBookingConfirmed(payload.data);
        break;
      case 'booking-cancelled':
        notificationService.handleBookingCancelled(payload.data);
        break;
      default:
        console.warn('[NotificationService] Unknown event type:', payload.type);
    }
  },

  /**
   * Обработка создания новой записи
   * Обновляет списки и в B2C (клиент), и в B2B (мерчант)
   */
  handleBookingCreated: (data: any) => {
    // Обновляем список моих записей (B2C)
    if (myBookingsStore.addBooking) {
      myBookingsStore.addBooking(data);
    } else {
      // Фоллбэк: принудительное обновление списка
      myBookingsStore.fetchMyBookings?.();
    }

    // Если текущий пользователь - мерчант, обновляем его дашборд (B2B)
    // Проверяем, принадлежит ли запись текущему мерчанту
    if (data.merchantId && merchantStore.merchantId === data.merchantId) {
      merchantStore.addBooking(data);
    }
  },

  /**
   * Обработка подтверждения записи мерчантом
   */
  handleBookingConfirmed: (data: any) => {
    // Обновляем статус в B2C
    myBookingsStore.updateBookingStatus?.(data.id, 'confirmed');
    
    // Обновляем в B2B
    merchantStore.updateBookingStatus?.(data.id, 'confirmed');
  },

  /**
   * Обработка отмены записи
   */
  handleBookingCancelled: (data: any) => {
    // Обновляем статус в B2C
    myBookingsStore.updateBookingStatus?.(data.id, 'cancelled');
    
    // Обновляем в B2B
    merchantStore.updateBookingStatus?.(data.id, 'cancelled');
  },
};
