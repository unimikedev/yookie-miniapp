/**
 * Bookings API functions
 * All backend responses are wrapped in { data: ... } — we unwrap here.
 */
import { api } from './client';
/**
 * Fetch available time slots for a master on a specific date.
 * Backend: GET /businesses/:businessId/slots?date=&masterId= → { data: SlotResult[] }
 */
export async function fetchSlots(businessId, masterId, date // YYYY-MM-DD format
) {
    const response = await api.get(`/businesses/${businessId}/slots`, { date, masterId });
    // Backend returns array of SlotResult per master — find ours
    const masterResult = (response.data ?? []).find((r) => r.masterId === masterId);
    const backendSlots = masterResult?.slots ?? [];
    // Transform backend TimeSlot → frontend TimeSlot
    return backendSlots.map((slot) => ({
        id: slot.startsAt, // ISO string used as unique key and for booking POST
        start: slot.time, // "HH:mm" — displayed in UI and used to construct startsAt
        end: slot.time,
        is_available: slot.available,
    }));
}
/**
 * Create a new booking.
 * Backend: POST /bookings → { data: Booking }
 * Body shape: { businessId, masterId, serviceId, startsAt, client: { phone, name } }
 */
export async function createBooking(data) {
    const response = await api.post('/bookings', {
        businessId: data.businessId,
        masterId: data.masterId,
        serviceId: data.serviceId,
        startsAt: data.startsAt,
        client: {
            phone: data.clientPhone,
            name: data.clientName,
        },
    });
    return response.data;
}
/**
 * Fetch user's bookings by phone number.
 * Backend: GET /my?phone= (registered at prefix /api/v1) → { data: Booking[] }
 */
export async function fetchMyBookings(phone) {
    const response = await api.get('/my', { phone });
    return response.data ?? [];
}
/**
 * Cancel a booking.
 * Backend: POST /bookings/:id/cancel → { success: true }
 */
export async function cancelBooking(id, phone) {
    await api.post(`/bookings/${id}/cancel`, { phone });
}
//# sourceMappingURL=bookings.js.map