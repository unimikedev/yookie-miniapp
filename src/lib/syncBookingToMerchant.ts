/**
 * Sync utility to propagate B2C booking events to B2B Merchant Store
 * 
 * This module bridges the gap between B2C booking creation and B2B visibility.
 * When a booking is created in B2C, it must appear immediately in the merchant's
 * Pro dashboard.
 */

import { useMerchantStore } from '@/pro/stores/merchantStore';
import { emit } from '@/pro/realtime';
import type { Booking } from '@/lib/api/types';
import type { MerchantBooking } from '@/lib/api/types';

/**
 * Sync a newly created B2C booking to the B2B merchant store.
 * 
 * This function:
 * 1. Transforms the B2C Booking shape to MerchantBooking
 * 2. Adds it to the merchant's local store (for offline-first UX)
 * 3. Emits a realtime event for other Pro screens to react
 */
export function syncBookingToMerchant(booking: Booking): void {
  // Extract business ID from the booking
  const merchantId = booking.business_id;
  if (!merchantId) {
    console.warn('[syncBookingToMerchant] No business_id in booking', booking);
    return;
  }

  // Check if user is managing this business
  const currentMerchantId = useMerchantStore.getState().merchantId;
  if (currentMerchantId !== merchantId) {
    // This booking belongs to a different merchant, skip
    return;
  }

  // Transform B2C Booking → MerchantBooking
  const merchantBooking: Omit<MerchantBooking, 'id' | 'created_at' | 'updated_at'> = {
    merchant_id: merchantId,
    client_id: booking.client_id || `client-${Date.now()}`,
    client_name: booking.client_name,
    client_phone: booking.client_phone,
    service_id: booking.service_id,
    master_id: booking.master_id,
    starts_at: booking.starts_at,
    ends_at: booking.ends_at,
    status: booking.status as MerchantBooking['status'],
    notes: booking.notes,
  };

  // Add to merchant store (this updates the persisted state)
  // Note: We're using the B2C merchantStore here for simplicity
  // In production, you might want a dedicated sync mechanism
  try {
    // Import the B2C merchant store dynamically to avoid circular deps
    import('@/stores/merchantStore').then(({ useMerchantStore: b2bStore }) => {
      b2bStore.getState().addBooking(merchantBooking);
    });
  } catch (err) {
    console.error('[syncBookingToMerchant] Failed to add booking to store', err);
  }

  // Emit realtime event for Pro screens to refetch
  emit({
    type: 'booking.created',
    bookingId: booking.id,
    merchantId,
  });
}

/**
 * Sync booking cancellation to merchant store
 */
export function syncBookingCancellationToMerchant(bookingId: string, merchantId: string): void {
  // Update merchant store
  try {
    import('@/stores/merchantStore').then(({ useMerchantStore: b2bStore }) => {
      const bookings = b2bStore.getState().bookings;
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        b2bStore.getState().updateBooking(bookingId, { status: 'cancelled' });
      }
    });
  } catch (err) {
    console.error('[syncBookingCancellationToMerchant] Failed to update booking', err);
  }

  // Emit realtime event
  emit({
    type: 'booking.cancelled',
    bookingId,
    merchantId,
  });
}

/**
 * Sync booking reschedule to merchant store
 */
export function syncBookingRescheduleToMerchant(
  bookingId: string,
  merchantId: string,
  newStartsAt: string,
  newMasterId?: string
): void {
  try {
    import('@/stores/merchantStore').then(({ useMerchantStore: b2bStore }) => {
      b2bStore.getState().updateBooking(bookingId, {
        starts_at: newStartsAt,
        ...(newMasterId ? { master_id: newMasterId } : {}),
      });
    });
  } catch (err) {
    console.error('[syncBookingRescheduleToMerchant] Failed to update booking', err);
  }

  emit({
    type: 'booking.updated',
    bookingId,
    merchantId,
  });
}
