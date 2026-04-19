import { emit } from '@/pro/realtime';
import type { Booking } from '@/lib/api/types';

/**
 * Notify Pro dashboard of a newly created B2C booking via realtime event.
 * BookingsBoardPage subscribes to these events and refetches from the API.
 */
export function syncBookingToMerchant(booking: Booking): void {
  const merchantId = booking.business_id;
  if (!merchantId) return;
  emit({ type: 'booking.created', bookingId: booking.id, merchantId });
}

export function syncBookingCancellationToMerchant(bookingId: string, merchantId: string): void {
  emit({ type: 'booking.cancelled', bookingId, merchantId });
}

export function syncBookingRescheduleToMerchant(bookingId: string, merchantId: string, _newStartsAt?: string, _newMasterId?: string): void {
  emit({ type: 'booking.updated', bookingId, merchantId });
}
