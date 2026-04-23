/**
 * Pro (B2B) API layer.
 *
 * Maps to REAL backend endpoints under `/businesses/:businessId/...`.
 * The frontend uses "merchantId" terminology but it maps 1:1 to businessId
 * in the backend. This is intentional — when Pro moves to a separate client,
 * only this file needs updating.
 *
 * Backend contract (Fastify):
 *   GET    /businesses/:id/bookings?date=&masterId=&status=
 *   PATCH  /bookings/:id/status         { status, cancelReason? }
 *   POST   /bookings/:id/reschedule     { startsAt, masterId? }
 *   GET    /businesses/:id/services
 *   POST   /businesses/:id/services     { name, price, duration_min, ... }
 *   PATCH  /businesses/:id/services/:sid
 *   DELETE /businesses/:id/services/:sid
 *   GET    /businesses/:id/masters
 *   POST   /businesses/:id/masters      { name, specialization, ... }
 *   PATCH  /businesses/:id/masters/:mid
 *   DELETE /businesses/:id/masters/:mid
 *   GET    /businesses/:id/analytics?from=&to=
 *
 * When backend is unavailable (DEV), falls back to in-memory mocks.
 */

import { api } from '@/lib/api/client';
import type { Booking, Master, Service, Client, BookingStatus } from '@/lib/api/types';
import {
  mockListMerchantBookings,
  mockListMerchantServices,
  mockListMerchantStaff,
  mockListMerchantClients,
  mockUpdateBookingStatus,
  mockRescheduleBooking,
  mockUpsertService,
  mockDeleteService,
  mockUpsertStaff,
  mockDeleteStaff,
  mockUpdateAvailability,
  mockDashboardSummary,
} from './proMocks';

const DEV = import.meta.env.DEV;

function shouldFallback(err: unknown): boolean {
  if (!DEV) return false;
  if (err instanceof Error) {
    return (
      err.message.includes('NETWORK_ERROR') ||
      err.message.includes('Нет связи') ||
      err.message.includes('Failed to fetch') ||
      err.message.includes('Load failed') ||
      err.message.includes('Not Found')
    );
  }
  return false;
}

// ─── Reads ────────────────────────────────────────────────────────────────────

/**
 * List bookings for a business.
 * Backend: GET /businesses/:id/bookings?date=YYYY-MM-DD
 */
export async function listBookings(
  merchantId: string,
  params: { from: string; to: string }
): Promise<Booking[]> {
  try {
    // Backend accepts `date` (single day), not from/to range.
    // Extract date from `from` param (YYYY-MM-DDT00:00:00 → YYYY-MM-DD)
    const date = params.from.slice(0, 10);
    const res = await api.get<Booking[]>(
      `/businesses/${merchantId}/bookings`,
      { date }
    );
    return res ?? [];
  } catch (err) {
    if (shouldFallback(err)) return mockListMerchantBookings(merchantId, params);
    throw err;
  }
}

export interface ActivityEvent {
  id: string;
  status: string;
  cancelled_by: string | null;
  cancel_reason: string | null;
  starts_at: string;
  created_at: string;
  updated_at: string;
  clients: { id: string; name: string; phone: string } | null;
  services: { id: string; name: string } | null;
  masters: { id: string; name: string } | null;
}

/**
 * Recent activity feed for Pro dashboard.
 * Backend: GET /businesses/:id/activity
 */
export async function listActivity(merchantId: string): Promise<ActivityEvent[]> {
  try {
    const res = await api.get<ActivityEvent[]>(
      `/businesses/${merchantId}/activity`
    );
    return res ?? [];
  } catch {
    return [];
  }
}

/**
 * Fetch all pending bookings (no date filter) — for dashboard confirmation block.
 * Backend: GET /businesses/:id/bookings?status=pending
 */
export async function listPendingBookings(merchantId: string): Promise<Booking[]> {
  try {
    const res = await api.get<Booking[]>(
      `/businesses/${merchantId}/bookings`,
      { status: 'pending' }
    );
    return res ?? [];
  } catch (err) {
    if (shouldFallback(err)) return [];
    throw err;
  }
}

/**
 * List services for a business.
 * Backend: GET /businesses/:id/services
 */
export async function listServices(merchantId: string): Promise<Service[]> {
  try {
    const res = await api.get<Service[]>(
      `/businesses/${merchantId}/services`
    );
    return res ?? [];
  } catch (err) {
    if (shouldFallback(err)) return mockListMerchantServices(merchantId);
    throw err;
  }
}

/**
 * List staff (masters) for a business.
 * Backend: GET /businesses/:id/masters
 */
export async function listStaff(merchantId: string): Promise<Master[]> {
  try {
    const res = await api.get<Master[]>(
      `/businesses/${merchantId}/masters`
    );
    return res ?? [];
  } catch (err) {
    if (shouldFallback(err)) return mockListMerchantStaff(merchantId);
    throw err;
  }
}

/**
 * List clients who have bookings with this business.
 * Backend has no direct endpoint for this — we derive clients from bookings.
 * TODO: Add GET /businesses/:id/clients on backend.
 */
export async function listClients(merchantId: string): Promise<Client[]> {
  try {
    // Fetch recent bookings and extract unique clients
    const res = await api.get<Booking[]>(
      `/businesses/${merchantId}/bookings`,
      {}
    );
    const bookings = res ?? [];
    const clientMap = new Map<string, Client>();
    for (const b of bookings) {
      if (b.clients && b.client_id && !clientMap.has(b.client_id)) {
        clientMap.set(b.client_id, {
          id: b.client_id,
          telegram_id: BigInt(b.clients.telegram_id ?? 0),
          phone: b.clients.phone,
          name: b.clients.name,
        });
      }
    }
    return Array.from(clientMap.values());
  } catch (err) {
    if (shouldFallback(err)) return mockListMerchantClients(merchantId);
    throw err;
  }
}

/**
 * Dashboard summary. Maps to analytics endpoint + today's bookings.
 * Backend: GET /businesses/:id/analytics?from=&to=
 */
export interface DashboardSummary {
  bookingsCount: number;
  revenuePlaceholder: number;
  loadPercent: number;
  emptySlots: number;
  cancellations: number;
}

export async function dashboardSummary(
  merchantId: string,
  date: string
): Promise<DashboardSummary> {
  try {
    // Use analytics endpoint for the day
    const dayStart = `${date}T00:00:00`;
    const dayEnd = `${date}T23:59:59`;
    const [analytics, bookings, staff] = await Promise.all([
      api.get<{
        bookings: { total: number; completed: number; cancelled: number };
        revenue: { total: number };
      }>(`/businesses/${merchantId}/analytics`, { from: dayStart, to: dayEnd }),
      api.get<Booking[]>(`/businesses/${merchantId}/bookings`, { date }),
      api.get<Master[]>(`/businesses/${merchantId}/masters`),
    ]);

    const bData = analytics?.bookings ?? { total: 0, completed: 0, cancelled: 0 };
    const todayBookings = bookings ?? [];
    const staffCount = (staff ?? []).filter((s) => s.is_active).length;

    // Crude load: booked minutes / (active staff * 10h)
    const minutesBooked = todayBookings.reduce((sum, b) => {
      if (b.status === 'cancelled' || b.status === 'no_show') return sum;
      const dur = (new Date(b.ends_at).getTime() - new Date(b.starts_at).getTime()) / 60000;
      return sum + dur;
    }, 0);
    const capacity = Math.max(1, staffCount) * 10 * 60;
    const loadPercent = Math.min(100, Math.round((minutesBooked / capacity) * 100));
    const emptySlots = Math.max(0, staffCount * 8 - todayBookings.length);

    return {
      bookingsCount: bData.total,
      revenuePlaceholder: analytics?.revenue?.total ?? 0,
      loadPercent,
      emptySlots,
      cancellations: bData.cancelled,
    };
  } catch (err) {
    if (shouldFallback(err)) return mockDashboardSummary(merchantId, date);
    throw err;
  }
}

// ─── Writes ───────────────────────────────────────────────────────────────────

export interface CreateBookingInput {
  businessId: string;
  masterId: string;
  serviceId: string;
  startsAt: string; // ISO datetime
  client: { phone: string; name: string };
  notes?: string;
}

/**
 * Create a new booking.
 * Backend: POST /bookings
 */
export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  return api.post<Booking>('/bookings', {
    ...input,
    leadSource: 'direct',
  });
}

/**
 * Update booking status.
 * Backend: PATCH /bookings/:id/status  { status }
 * Note: endpoint is NOT scoped to business — bookingId is globally unique.
 */
export async function updateBookingStatus(
  _merchantId: string,
  bookingId: string,
  status: BookingStatus
): Promise<Booking> {
  try {
    return api.patch<Booking>(
      `/bookings/${bookingId}/status`,
      { status }
    );
  } catch (err) {
    if (shouldFallback(err)) return mockUpdateBookingStatus(_merchantId, bookingId, status);
    throw err;
  }
}

/**
 * Reschedule a booking.
 * Backend: POST /bookings/:id/reschedule  { startsAt, masterId? }
 */
export async function rescheduleBooking(
  _merchantId: string,
  bookingId: string,
  patch: { startsAt?: string; endsAt?: string; masterId?: string }
): Promise<Booking> {
  try {
    return api.post<Booking>(
      `/bookings/${bookingId}/reschedule`,
      { startsAt: patch.startsAt, masterId: patch.masterId }
    );
  } catch (err) {
    if (shouldFallback(err)) return mockRescheduleBooking(_merchantId, bookingId, patch);
    throw err;
  }
}

// ─── Services CRUD ────────────────────────────────────────────────────────────

export type ServiceInput = Partial<Service> & {
  name: string;
  price: number;
  duration_min: number;
};

/**
 * Create or update a service.
 * Backend: POST /businesses/:id/services (create)
 *          PATCH /businesses/:id/services/:sid (update)
 */
export async function upsertService(
  merchantId: string,
  input: ServiceInput
): Promise<Service> {
  try {
    if (input.id) {
      return api.patch<Service>(
        `/businesses/${merchantId}/services/${input.id}`,
        { name: input.name, price: input.price, duration_min: input.duration_min, description: input.description, category: input.category }
      );
    }
    return api.post<Service>(
      `/businesses/${merchantId}/services`,
      { name: input.name, price: input.price, duration_min: input.duration_min, description: input.description, category: input.category }
    );
  } catch (err) {
    if (shouldFallback(err)) return mockUpsertService(merchantId, input);
    throw err;
  }
}

/**
 * Update the display position of a single service (fire-and-forget safe).
 * Backend: PATCH /businesses/:id/services/:sid  { position }
 */
export async function reorderService(merchantId: string, serviceId: string, position: number): Promise<void> {
  try {
    await api.patch<unknown>(`/businesses/${merchantId}/services/${serviceId}`, { position });
  } catch {
    // non-critical
  }
}

/**
 * Delete (soft) a service.
 * Backend: DELETE /businesses/:id/services/:sid
 */
export async function deleteService(merchantId: string, serviceId: string): Promise<void> {
  try {
    await api.delete<unknown>(`/businesses/${merchantId}/services/${serviceId}`);
  } catch (err) {
    if (shouldFallback(err)) { await mockDeleteService(merchantId, serviceId); return; }
    throw err;
  }
}

// ─── Staff (Masters) CRUD ─────────────────────────────────────────────────────

export type StaffInput = Partial<Master> & { name: string; specialization: string };

/**
 * Replace the full set of services a master can perform.
 * Backend: PATCH /businesses/:id/masters/:mid  { service_ids: [...] }
 */
export async function updateMasterServices(
  merchantId: string,
  masterId: string,
  serviceIds: string[],
): Promise<void> {
  await api.patch<{ data: Master }>(
    `/businesses/${merchantId}/masters/${masterId}`,
    { service_ids: serviceIds },
  );
}

/**
 * Create or update a staff member (master).
 * Backend: POST /businesses/:id/masters (create)
 *          PATCH /businesses/:id/masters/:mid (update)
 */
export async function upsertStaff(
  merchantId: string,
  input: StaffInput
): Promise<Master> {
  try {
    const body = {
      name: input.name,
      specialization: input.specialization,
      bio: input.bio,
      photo_url: input.photo_url,
      working_days: input.working_days,
      breaks: input.breaks,
    };
    if (input.id) {
      return api.patch<Master>(
        `/businesses/${merchantId}/masters/${input.id}`,
        body
      );
    }
    return api.post<Master>(
      `/businesses/${merchantId}/masters`,
      body
    );
  } catch (err) {
    if (shouldFallback(err)) return mockUpsertStaff(merchantId, input);
    throw err;
  }
}

/**
 * Delete (soft) a staff member.
 * Backend: DELETE /businesses/:id/masters/:mid
 */
export async function deleteStaff(merchantId: string, staffId: string): Promise<void> {
  try {
    await api.delete<unknown>(`/businesses/${merchantId}/masters/${staffId}`);
  } catch (err) {
    if (shouldFallback(err)) { await mockDeleteStaff(merchantId, staffId); return; }
    throw err;
  }
}

// ─── Invites ──────────────────────────────────────────────────────────────────

const INVITE_API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('yookie_auth_token');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

export interface Invite {
  id: string;
  token: string;
  role: string;
  master_id: string | null;
  master_name?: string | null;
  created_at: string;
  used_at: string | null;
  expires_at: string;
  is_used: boolean;
  link: string;
}

export async function createInvite(masterId?: string): Promise<{ token: string; link: string; expires_at: string }> {
  const res = await fetch(`${INVITE_API_BASE}/invites`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ masterId }),
  });
  if (!res.ok) throw new Error('Failed to create invite');
  return res.json() as Promise<{ token: string; link: string; expires_at: string }>;
}

export async function listInvites(): Promise<Invite[]> {
  const res = await fetch(`${INVITE_API_BASE}/invites`, { headers: authHeaders() });
  if (!res.ok) return [];
  const data = await res.json() as { data?: Invite[] };
  return data.data ?? [];
}

export async function deleteInvite(id: string): Promise<void> {
  await fetch(`${INVITE_API_BASE}/invites/${id}`, { method: 'DELETE', headers: authHeaders() });
}

export async function getInviteInfo(token: string): Promise<{
  valid: boolean;
  businessId?: string;
  businessName?: string;
  role?: string;
  masterId?: string | null;
  reason?: string;
}> {
  const res = await fetch(`${INVITE_API_BASE}/invites/${token}`);
  return res.json() as Promise<{
    valid: boolean;
    businessId?: string;
    businessName?: string;
    role?: string;
    masterId?: string | null;
    reason?: string;
  }>;
}

export async function acceptInvite(token: string): Promise<{
  token: string;
  businessId: string;
  masterId: string | null;
  role: string;
}> {
  const authToken = localStorage.getItem('yookie_auth_token');
  const res = await fetch(`${INVITE_API_BASE}/invites/${token}/accept`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to accept invite');
  return res.json() as Promise<{
    token: string;
    businessId: string;
    masterId: string | null;
    role: string;
  }>;
}

// ─── Availability ─────────────────────────────────────────────────────────────
// Backend stores availability as `working_days` (Record<day, bool>) + `breaks`
// on the master record. We update via PATCH /businesses/:id/masters/:mid.

export interface AvailabilityDay {
  weekday: number; // 0 = Sun ... 6 = Sat
  open: string; // "HH:mm"
  close: string; // "HH:mm"
  enabled: boolean;
}

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/**
 * Update staff availability by patching the master's working_days + breaks.
 * Converts AvailabilityDay[] → { working_days, breaks } for backend.
 */
export async function updateAvailability(
  merchantId: string,
  staffId: string,
  days: AvailabilityDay[]
): Promise<AvailabilityDay[]> {
  try {
    const working_days: Record<string, boolean> = {};
    for (const d of days) {
      working_days[WEEKDAY_KEYS[d.weekday]] = d.enabled;
    }
    // Store open/close as business working_hours format on the master
    // For now we just toggle days on/off via working_days field
    await api.patch<{ data: Master }>(
      `/businesses/${merchantId}/masters/${staffId}`,
      { working_days }
    );
    return days;
  } catch (err) {
    if (shouldFallback(err)) return mockUpdateAvailability(merchantId, staffId, days);
    throw err;
  }
}

export async function patchBusiness(merchantId: string, fields: Record<string, unknown>): Promise<void> {
  await api.patch<unknown>(`/businesses/${merchantId}`, fields)
}
