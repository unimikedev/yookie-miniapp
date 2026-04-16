/**
 * In-memory mocks for Pro (B2B) API.
 *
 * Used only when the backend endpoints are not yet implemented. Data lives
 * for the session only. The shapes mirror the canonical shared types so the
 * UI doesn't care whether the data is mocked or real.
 *
 * When backend is ready: delete this file and remove the fallbacks in
 * `pro/api/index.ts`.
 */

import type { Booking, BookingStatus, Client, Master, Service } from '@/lib/api/types';
import type { AvailabilityDay, ServiceInput, StaffInput } from './index';

// ─── Seed data ────────────────────────────────────────────────────────────────
function isoAt(hour: number, min = 0, dayOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

const STATE = (() => {
  const merchantId = 'demo-merchant';
  const staff: Master[] = [
    {
      id: 's1', business_id: merchantId, name: 'Анна', specialization: 'Стилист',
      rating: 4.9, review_count: 42, working_days: ['mon','tue','wed','thu','fri'],
      is_active: true, position: 1,
    },
    {
      id: 's2', business_id: merchantId, name: 'Мария', specialization: 'Мастер маникюра',
      rating: 4.8, review_count: 31, working_days: ['tue','wed','thu','fri','sat'],
      is_active: true, position: 2,
    },
    {
      id: 's3', business_id: merchantId, name: 'Елена', specialization: 'Косметолог',
      rating: 4.7, review_count: 18, working_days: ['mon','wed','fri'],
      is_active: true, position: 3,
    },
  ];

  const services: Service[] = [
    { id: 'svc1', business_id: merchantId, name: 'Женская стрижка', price: 2500, duration_min: 60, category: 'hair', is_active: true, position: 1 },
    { id: 'svc2', business_id: merchantId, name: 'Маникюр', price: 1800, duration_min: 90, category: 'nail', is_active: true, position: 2 },
    { id: 'svc3', business_id: merchantId, name: 'Чистка лица', price: 3200, duration_min: 75, category: 'cosmetology', is_active: true, position: 3 },
  ];

  const clients: Client[] = [
    { id: 'c1', telegram_id: BigInt(0), phone: '+79990000001', name: 'Ольга' },
    { id: 'c2', telegram_id: BigInt(0), phone: '+79990000002', name: 'Ирина' },
    { id: 'c3', telegram_id: BigInt(0), phone: '+79990000003', name: 'Дмитрий' },
  ];

  const bookings: Booking[] = [
    {
      id: 'b1', business_id: merchantId, master_id: 's1', service_id: 'svc1', client_id: 'c1',
      starts_at: isoAt(10, 0), ends_at: isoAt(11, 0), status: 'confirmed', price: 2500,
      clients: { id: 'c1', name: 'Ольга', phone: '+79990000001' },
      services: { id: 'svc1', name: 'Женская стрижка', price: 2500, duration_min: 60 },
      masters: { id: 's1', name: 'Анна' },
    },
    {
      id: 'b2', business_id: merchantId, master_id: 's2', service_id: 'svc2', client_id: 'c2',
      starts_at: isoAt(12, 30), ends_at: isoAt(14, 0), status: 'pending', price: 1800,
      clients: { id: 'c2', name: 'Ирина', phone: '+79990000002' },
      services: { id: 'svc2', name: 'Маникюр', price: 1800, duration_min: 90 },
      masters: { id: 's2', name: 'Мария' },
    },
    {
      id: 'b3', business_id: merchantId, master_id: 's1', service_id: 'svc1', client_id: 'c3',
      starts_at: isoAt(15, 0), ends_at: isoAt(16, 0), status: 'confirmed', price: 2500,
      clients: { id: 'c3', name: 'Дмитрий', phone: '+79990000003' },
      services: { id: 'svc1', name: 'Женская стрижка', price: 2500, duration_min: 60 },
      masters: { id: 's1', name: 'Анна' },
    },
  ];

  const availability = new Map<string, AvailabilityDay[]>();

  return { staff, services, clients, bookings, availability };
})();

// ─── Bookings ─────────────────────────────────────────────────────────────────
export async function mockListMerchantBookings(
  _merchantId: string,
  params: { from: string; to: string }
): Promise<Booking[]> {
  const from = new Date(params.from).getTime();
  const to = new Date(params.to).getTime();
  return STATE.bookings.filter((b) => {
    const t = new Date(b.starts_at).getTime();
    return t >= from && t <= to;
  });
}

export async function mockUpdateBookingStatus(
  _merchantId: string,
  bookingId: string,
  status: BookingStatus
): Promise<Booking> {
  const b = STATE.bookings.find((x) => x.id === bookingId);
  if (!b) throw new Error('Booking not found');
  b.status = status;
  return b;
}

export async function mockRescheduleBooking(
  _merchantId: string,
  bookingId: string,
  patch: { startsAt?: string; endsAt?: string; masterId?: string }
): Promise<Booking> {
  const b = STATE.bookings.find((x) => x.id === bookingId);
  if (!b) throw new Error('Booking not found');
  if (patch.startsAt) b.starts_at = patch.startsAt;
  if (patch.endsAt) b.ends_at = patch.endsAt;
  if (patch.masterId) b.master_id = patch.masterId;
  return b;
}

// ─── Services ─────────────────────────────────────────────────────────────────
export async function mockListMerchantServices(_merchantId: string): Promise<Service[]> {
  return [...STATE.services];
}

export async function mockUpsertService(
  merchantId: string,
  input: ServiceInput
): Promise<Service> {
  if (input.id) {
    const existing = STATE.services.find((s) => s.id === input.id);
    if (!existing) throw new Error('Service not found');
    Object.assign(existing, input);
    return existing;
  }
  const created: Service = {
    id: `svc_${Date.now()}`,
    business_id: merchantId,
    name: input.name,
    price: input.price,
    duration_min: input.duration_min,
    category: input.category ?? 'other',
    description: input.description,
    is_active: input.is_active ?? true,
    position: STATE.services.length + 1,
  };
  STATE.services.push(created);
  return created;
}

export async function mockDeleteService(_merchantId: string, serviceId: string): Promise<void> {
  const idx = STATE.services.findIndex((s) => s.id === serviceId);
  if (idx >= 0) STATE.services.splice(idx, 1);
}

// ─── Staff ────────────────────────────────────────────────────────────────────
export async function mockListMerchantStaff(_merchantId: string): Promise<Master[]> {
  return [...STATE.staff];
}

export async function mockUpsertStaff(
  merchantId: string,
  input: StaffInput
): Promise<Master> {
  if (input.id) {
    const existing = STATE.staff.find((s) => s.id === input.id);
    if (!existing) throw new Error('Staff not found');
    Object.assign(existing, input);
    return existing;
  }
  const created: Master = {
    id: `staff_${Date.now()}`,
    business_id: merchantId,
    name: input.name,
    specialization: input.specialization,
    bio: input.bio,
    photo_url: input.photo_url,
    rating: 0,
    review_count: 0,
    working_days: input.working_days ?? ['mon', 'tue', 'wed', 'thu', 'fri'],
    is_active: input.is_active ?? true,
    position: STATE.staff.length + 1,
  };
  STATE.staff.push(created);
  return created;
}

export async function mockDeleteStaff(_merchantId: string, staffId: string): Promise<void> {
  const idx = STATE.staff.findIndex((s) => s.id === staffId);
  if (idx >= 0) STATE.staff.splice(idx, 1);
}

// ─── Clients ──────────────────────────────────────────────────────────────────
export async function mockListMerchantClients(_merchantId: string): Promise<Client[]> {
  return [...STATE.clients];
}

// ─── Availability ─────────────────────────────────────────────────────────────
export async function mockUpdateAvailability(
  _merchantId: string,
  staffId: string,
  days: AvailabilityDay[]
): Promise<AvailabilityDay[]> {
  STATE.availability.set(staffId, days);
  return days;
}

export function mockGetAvailability(staffId: string): AvailabilityDay[] {
  return (
    STATE.availability.get(staffId) ??
    [0, 1, 2, 3, 4, 5, 6].map((w) => ({
      weekday: w,
      open: '09:00',
      close: '20:00',
      enabled: w !== 0,
    }))
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export async function mockDashboardSummary(_merchantId: string, date: string) {
  const day = new Date(date);
  const dayStart = new Date(day); dayStart.setHours(0,0,0,0);
  const dayEnd = new Date(day); dayEnd.setHours(23,59,59,999);
  const today = STATE.bookings.filter((b) => {
    const t = new Date(b.starts_at).getTime();
    return t >= dayStart.getTime() && t <= dayEnd.getTime();
  });
  const revenue = today
    .filter((b) => b.status !== 'cancelled' && b.status !== 'no_show')
    .reduce((sum, b) => sum + (b.price ?? 0), 0);
  const cancellations = today.filter((b) => b.status === 'cancelled').length;
  // crude load: minutes booked / (staff * 10h)
  const minutesBooked = today.reduce((sum, b) => {
    return sum + (new Date(b.ends_at).getTime() - new Date(b.starts_at).getTime()) / 60000;
  }, 0);
  const capacity = Math.max(1, STATE.staff.length) * 10 * 60;
  const loadPercent = Math.min(100, Math.round((minutesBooked / capacity) * 100));
  const emptySlots = Math.max(0, STATE.staff.length * 8 - today.length);
  return {
    bookingsCount: today.length,
    revenuePlaceholder: revenue,
    loadPercent,
    emptySlots,
    cancellations,
  };
}
