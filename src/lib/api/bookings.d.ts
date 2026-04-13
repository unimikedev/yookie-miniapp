/**
 * Bookings API functions
 * All backend responses are wrapped in { data: ... } — we unwrap here.
 */
import { TimeSlot, Booking, CreateBookingPayload } from './types';
/**
 * Fetch available time slots for a master on a specific date.
 * Backend: GET /businesses/:businessId/slots?date=&masterId= → { data: SlotResult[] }
 */
export declare function fetchSlots(businessId: string, masterId: string, date: string): Promise<TimeSlot[]>;
/**
 * Create a new booking.
 * Backend: POST /bookings → { data: Booking }
 * Body shape: { businessId, masterId, serviceId, startsAt, client: { phone, name } }
 */
export declare function createBooking(data: CreateBookingPayload): Promise<Booking>;
/**
 * Fetch user's bookings by phone number.
 * Backend: GET /my?phone= (registered at prefix /api/v1) → { data: Booking[] }
 */
export declare function fetchMyBookings(phone: string): Promise<Booking[]>;
/**
 * Cancel a booking.
 * Backend: POST /bookings/:id/cancel → { success: true }
 */
export declare function cancelBooking(id: string, phone: string): Promise<void>;
//# sourceMappingURL=bookings.d.ts.map