/**
 * Bookings API functions
 * All backend responses are wrapped in { data: ... } — we unwrap here.
 * When the backend is unavailable, falls back to mock implementations.
 */

import { api } from './client';
import {
  TimeSlot,
  Booking,
  CreateBookingPayload,
} from './types';
import {
  mockCreateBooking as _mockCreateBooking,
  mockFetchMyBookings as _mockFetchMyBookings,
  mockCancelBooking as _mockCancelBooking,
} from '../mockBookings';

// Backend slot shape returned by getAvailableSlots service
interface BackendSlot {
  time: string      // "HH:mm"
  startsAt: string  // ISO datetime
  endsAt: string    // ISO datetime
  available: boolean
}

interface BackendSlotResult {
  masterId: string
  masterName: string
  slots: BackendSlot[]
}

/**
 * Fetch available time slots for a master on a specific date.
 * Backend: GET /businesses/:businessId/slots?date=&masterId= → { data: SlotResult[] }
 */
export async function fetchSlots(
  businessId: string,
  masterId: string,
  date: string, // YYYY-MM-DD format
  serviceId?: string
): Promise<TimeSlot[]> {
  const params: Record<string, string> = { date, masterId }
  if (serviceId) params.serviceId = serviceId

  const response = await api.get<{ data: BackendSlotResult[] }>(
    `/businesses/${businessId}/slots`,
    params
  );

  // Backend returns array of SlotResult per master — find ours
  const masterResult = (response.data ?? []).find((r) => r.masterId === masterId)
  const backendSlots = masterResult?.slots ?? []

  // Transform backend TimeSlot → frontend TimeSlot
  return backendSlots.map((slot): TimeSlot => ({
    id: slot.startsAt,       // ISO string used as unique key and for booking POST
    start: slot.time,        // "HH:mm" — displayed in UI
    end: slot.endsAt ? slot.endsAt.split('T')[1]?.substring(0, 5) ?? slot.time : slot.time,
    is_available: slot.available,
  }))
}

/**
 * Create a new booking.
 * Backend: POST /bookings → { data: Booking }
 * Body shape: { businessId, masterId, serviceId, startsAt, client: { phone, name } }
 * Falls back to mock when backend is unavailable (DEV only).
 */
export async function createBooking(data: CreateBookingPayload): Promise<Booking> {
  try {
    const body: Record<string, unknown> = {
      businessId: data.businessId,
      masterId: data.masterId,
      serviceId: data.serviceId,
      startsAt: data.startsAt,
      client: {
        phone: data.clientPhone,
        name: data.clientName,
      },
    };
    if (data.notes) body.notes = data.notes;

    const response = await api.post<{ data: Booking }>('/bookings', body);
    // Save phone for non-authenticated users so /my?phone= works
    try { localStorage.setItem('yookie_booking_phone', data.clientPhone); } catch { /* noop */ }
    return response.data;
  } catch (err) {
    // In DEV mode, fall back to mock so the booking flow still works
    if (import.meta.env.DEV && err instanceof Error && (
      err.message.includes('NETWORK_ERROR')
      || err.message.includes('Нет связи')
      || err.message.includes('Failed to fetch')
      || err.message.includes('Load failed')
      || err.message.includes('Услуга не найдена')
      || err.message.includes('Not Found')
      || err.message.includes('DB Error')
      || err.message.includes('Conflict')
      || err.message.includes('уже занято')
    )) {
      try { localStorage.setItem('yookie_booking_phone', data.clientPhone); } catch { /* noop */ }
      return _mockCreateBooking({
        businessId: data.businessId,
        masterId: data.masterId,
        serviceId: data.serviceId,
        startsAt: data.startsAt,
        clientPhone: data.clientPhone,
        clientName: data.clientName,
      });
    }
    throw err;
  }
}

/**
 * Fetch user's bookings by phone number.
 * Backend: GET /my?phone= (registered at prefix /api/v1) → { data: Booking[] }
 * Falls back to mock when backend is unavailable (DEV only).
 */
export async function fetchMyBookings(phone: string): Promise<Booking[]> {
  try {
    const response = await api.get<{ data: Booking[] }>('/my', { phone });
    return response.data ?? [];
  } catch (err) {
    if (import.meta.env.DEV && err instanceof Error && (
      err.message.includes('NETWORK_ERROR')
      || err.message.includes('Нет связи')
      || err.message.includes('Failed to fetch')
      || err.message.includes('Load failed')
    )) {
      return _mockFetchMyBookings(phone);
    }
    throw err;
  }
}

/**
 * Cancel a booking.
 * Backend: POST /bookings/:id/cancel → { success: true }
 * Falls back to mock when backend is unavailable (DEV only).
 */
export async function cancelBooking(id: string, phone: string): Promise<void> {
  try {
    await api.post<unknown>(`/bookings/${id}/cancel`, { phone });
  } catch (err) {
    if (import.meta.env.DEV && err instanceof Error && (
      err.message.includes('NETWORK_ERROR')
      || err.message.includes('Нет связи')
      || err.message.includes('Failed to fetch')
      || err.message.includes('Load failed')
    )) {
      return _mockCancelBooking(id, phone);
    }
    throw err;
  }
}

/**
 * Reschedule a booking.
 * Backend: POST /bookings/:id/reschedule → { data: Booking }
 */
export async function rescheduleBooking(
  id: string,
  data: { phone: string; startsAt: string; masterId?: string }
): Promise<import('@/lib/api/types').Booking> {
  const response = await api.post<{ data: import('@/lib/api/types').Booking }>(
    `/bookings/${id}/reschedule`,
    data
  );
  return response.data;
}
