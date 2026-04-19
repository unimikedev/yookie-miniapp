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

export const notificationService = {
  handleEvent: (payload: WebhookPayload) => {
    console.log('[NotificationService] Received event:', payload);
  },
  handleBookingCreated: (_data: any) => {},
  handleBookingConfirmed: (_data: any) => {},
  handleBookingCancelled: (_data: any) => {},
};
