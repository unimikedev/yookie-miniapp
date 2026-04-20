/**
 * Real-time sync abstraction for Pro ↔ B2C bookings.
 *
 * The contract: any mutation on bookings, services, staff or availability
 * — from either side — emits an event that Pro screens subscribe to, so
 * the merchant sees B2C bookings appear instantly and B2C clients see
 * schedule changes immediately.
 *
 * Current implementation is a lightweight event bus + polling shim. When
 * backend WebSocket / SSE is ready, swap `subscribe()` to wire directly
 * to the transport without changing callers.
 */

export type RealtimeEvent =
  | { type: 'booking.created'; bookingId: string; merchantId: string }
  | { type: 'booking.updated'; bookingId: string; merchantId: string }
  | { type: 'booking.cancelled'; bookingId: string; merchantId: string }
  | { type: 'service.changed'; merchantId: string }
  | { type: 'staff.changed'; merchantId: string }
  | { type: 'availability.changed'; merchantId: string; staffId: string };

type Listener = (ev: RealtimeEvent) => void;

const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emit(ev: RealtimeEvent): void {
  // Microtask to decouple emit from handlers
  queueMicrotask(() => {
    for (const l of listeners) {
      try { l(ev); } catch { /* swallow — one bad listener shouldn't break others */ }
    }
  });
}

/** Polling shim: re-fetch every N ms. Replace with WS when backend supports it. */
export function startPolling(fn: () => void, ms = 5000): () => void {
  const id = window.setInterval(fn, ms);
  return () => window.clearInterval(id);
}
