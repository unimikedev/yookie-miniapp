/**
 * Mock booking data and functions for offline/development use.
 * When the backend is unavailable, these simulate booking creation,
 * fetching, and cancellation using localStorage persistence.
 *
 * IMPORTANT: Bookings are stored keyed by the phone used at creation.
 * fetchMyBookings(phone) returns only bookings created with that exact phone.
 */

import { Booking } from './api/types';

const STORAGE_KEY = 'yookie_mock_bookings';

function loadMockBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMockBookings(bookings: Booking[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch {
    // localStorage full — ignore
  }
}

/**
 * Generate a deterministic mock booking from the creation payload.
 */
export function createMockBooking(payload: {
  businessId: string;
  masterId: string;
  serviceId: string;
  startsAt: string;
  clientPhone: string;
  clientName: string;
}): Booking {
  // Derive a pseudo-unique id from payload
  const seed = `${payload.businessId}-${payload.masterId}-${payload.serviceId}-${payload.startsAt}-${payload.clientPhone}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const id = `mock-booking-${Math.abs(hash).toString(16)}`;

  // Derive business name from ID prefix
  const bizPrefix = payload.businessId.startsWith('a1') ? 'Glam Studio'
    : payload.businessId.startsWith('a2') ? 'Blade & Fade'
    : payload.businessId.startsWith('a3') ? 'Nail Lab'
    : payload.businessId.startsWith('a4') ? 'Zen Spa'
    : payload.businessId.startsWith('a5') ? 'Brow House'
    : payload.businessId.startsWith('a6') ? 'Derma Clinic'
    : payload.businessId.startsWith('a7') ? 'Iron Gym'
    : payload.businessId.startsWith('a8') ? 'Ink Masters'
    : 'Заведение';

  const mockServiceName = payload.serviceId.startsWith('c1') ? 'Женская стрижка'
    : payload.serviceId.startsWith('c2') ? 'Классическая стрижка'
    : payload.serviceId.startsWith('c3') ? 'Маникюр с гель-лаком'
    : payload.serviceId.startsWith('c4') ? 'Расслабляющий массаж (60 мин)'
    : payload.serviceId.startsWith('c5') ? 'Архитектура бровей'
    : payload.serviceId.startsWith('c6') ? 'Глубокая чистка лица'
    : payload.serviceId.startsWith('c7') ? 'Персональная тренировка (60 мин)'
    : payload.serviceId.startsWith('c8') ? 'Эскиз тату'
    : 'Услуга';

  const mockServicePrice = payload.serviceId.startsWith('c1111111') ? 80000
    : payload.serviceId.startsWith('c1111112') ? 250000
    : payload.serviceId.startsWith('c1111113') ? 120000
    : payload.serviceId.startsWith('c2222221') ? 60000
    : payload.serviceId.startsWith('c2222222') ? 90000
    : payload.serviceId.startsWith('c2222223') ? 70000
    : payload.serviceId.startsWith('c3333331') ? 90000
    : payload.serviceId.startsWith('c3333332') ? 80000
    : payload.serviceId.startsWith('c3333333') ? 180000
    : payload.serviceId.startsWith('c4444441') ? 150000
    : payload.serviceId.startsWith('c4444442') ? 200000
    : payload.serviceId.startsWith('c4444443') ? 180000
    : payload.serviceId.startsWith('c5555551') ? 50000
    : payload.serviceId.startsWith('c5555552') ? 120000
    : payload.serviceId.startsWith('c6666661') ? 200000
    : payload.serviceId.startsWith('c6666662') ? 250000
    : payload.serviceId.startsWith('c6666663') ? 350000
    : payload.serviceId.startsWith('c7777771') ? 120000
    : payload.serviceId.startsWith('c7777772') ? 80000
    : payload.serviceId.startsWith('c8888881') ? 50000
    : payload.serviceId.startsWith('c8888882') ? 300000
    : payload.serviceId.startsWith('c8888883') ? 700000
    : 100000;

  const mockServiceDuration = payload.serviceId.startsWith('c1111111') ? 60
    : payload.serviceId.startsWith('c1111112') ? 120
    : payload.serviceId.startsWith('c1111113') ? 60
    : payload.serviceId.startsWith('c2222221') ? 45
    : payload.serviceId.startsWith('c2222222') ? 60
    : payload.serviceId.startsWith('c2222223') ? 45
    : payload.serviceId.startsWith('c3333331') ? 90
    : payload.serviceId.startsWith('c3333332') ? 90
    : payload.serviceId.startsWith('c3333333') ? 120
    : payload.serviceId.startsWith('c4444441') ? 60
    : payload.serviceId.startsWith('c4444442') ? 90
    : payload.serviceId.startsWith('c4444443') ? 60
    : payload.serviceId.startsWith('c5555551') ? 60
    : payload.serviceId.startsWith('c5555552') ? 60
    : payload.serviceId.startsWith('c6666661') ? 90
    : payload.serviceId.startsWith('c6666662') ? 60
    : payload.serviceId.startsWith('c6666663') ? 60
    : payload.serviceId.startsWith('c7777771') ? 60
    : payload.serviceId.startsWith('c7777772') ? 60
    : payload.serviceId.startsWith('c8888881') ? 60
    : payload.serviceId.startsWith('c8888882') ? 120
    : payload.serviceId.startsWith('c8888883') ? 180
    : 60;

  const masterName = payload.masterId.startsWith('b1111111') ? 'Алия Каримова'
    : payload.masterId.startsWith('b1111112') ? 'Диана Юсупова'
    : payload.masterId.startsWith('b2222221') ? 'Дамир Рашидов'
    : payload.masterId.startsWith('b2222222') ? 'Шохрух Мирзаев'
    : payload.masterId.startsWith('b3333331') ? 'Камила Азимова'
    : payload.masterId.startsWith('b4444441') ? 'Нилуфар Хасанова'
    : payload.masterId.startsWith('b4444442') ? 'Зарина Омонова'
    : payload.masterId.startsWith('b5555551') ? 'Малика Турсунова'
    : payload.masterId.startsWith('b6666661') ? 'Гулнора Исмаилова'
    : payload.masterId.startsWith('b7777771') ? 'Бобур Холматов'
    : payload.masterId.startsWith('b8888881') ? 'Рустам Назаров'
    : 'Специалист';

  const startsAtDate = new Date(payload.startsAt);
  const endsAtDate = new Date(startsAtDate.getTime() + mockServiceDuration * 60 * 1000);

  // Map business ID to category for mock data
  const bizCategory = payload.businessId.startsWith('a1') ? 'beauty_salon'
    : payload.businessId.startsWith('a2') ? 'barber'
    : payload.businessId.startsWith('a3') ? 'nail'
    : payload.businessId.startsWith('a4') ? 'spa_massage'
    : payload.businessId.startsWith('a5') ? 'brow_lash'
    : payload.businessId.startsWith('a6') ? 'cosmetology'
    : payload.businessId.startsWith('a7') ? 'fitness'
    : payload.businessId.startsWith('a8') ? 'tattoo'
    : undefined;

  const booking: Booking = {
    id,
    business_id: payload.businessId,
    master_id: payload.masterId,
    service_id: payload.serviceId,
    client_id: `mock-client-${payload.clientPhone.replace(/\D/g, '')}`,
    starts_at: startsAtDate.toISOString(),
    ends_at: endsAtDate.toISOString(),
    status: 'confirmed',
    price: mockServicePrice,
    notes: undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    businesses: {
      id: payload.businessId,
      name: bizPrefix,
      address: 'Ташкент',
      phone: '+998901234567',
      category: bizCategory,
    },
    masters: {
      id: payload.masterId,
      name: masterName,
      photo_url: undefined,
    },
    services: {
      id: payload.serviceId,
      name: mockServiceName,
      price: mockServicePrice,
      duration_min: mockServiceDuration,
    },
    clients: {
      id: `mock-client-${payload.clientPhone.replace(/\D/g, '')}`,
      name: payload.clientName,
      phone: payload.clientPhone,
    },
  };

  return booking;
}

/**
 * Create a booking and persist it in localStorage.
 */
export function mockCreateBooking(payload: {
  businessId: string;
  masterId: string;
  serviceId: string;
  startsAt: string;
  clientPhone: string;
  clientName: string;
}): Promise<Booking> {
  return new Promise((resolve, reject) => {
    // Simulate network latency
    setTimeout(() => {
      const booking = createMockBooking(payload);

      // Check for conflicts (same master, overlapping time)
      const existing = loadMockBookings();
      const startsAt = new Date(payload.startsAt);
      const endsAt = new Date(startsAt.getTime() + (booking.services?.duration_min ?? 60) * 60 * 1000);

      const conflict = existing.find(b =>
        b.master_id === payload.masterId
        && b.status !== 'cancelled'
        && new Date(b.starts_at) < endsAt
        && new Date(b.ends_at) > startsAt
      );

      if (conflict) {
        reject(new Error('Это время уже занято. Пожалуйста, выберите другой слот.'));
        return;
      }

      // Save
      existing.push(booking);
      saveMockBookings(existing);

      resolve(booking);
    }, 300);
  });
}

/**
 * Fetch bookings by phone from localStorage.
 * Matches by:
 *  1. Exact phone match in clients.phone
 *  2. client_id starts with 'mock-client-' followed by matching digits
 *  3. Fallback: return ALL bookings if no phone match (for dev/demo)
 */
export function mockFetchMyBookings(phone: string): Promise<Booking[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const all = loadMockBookings();
      const phoneDigits = phone.replace(/\D/g, '');

      // If no phone is available, return all bookings
      if (!phoneDigits) {
        resolve(all);
        return;
      }

      const matched = all.filter(b => {
        const clientPhone = (b.clients as { phone?: string } | null)?.phone?.replace(/\D/g, '') || '';
        const clientIdDigits = (b.client_id || '').replace('mock-client-', '').replace(/\D/g, '');

        // Exact phone match
        if (clientPhone === phoneDigits) return true;
        // Client ID digits match
        if (clientIdDigits === phoneDigits) return true;
        // Partial match: the stored phone is a prefix or suffix of the query
        if (clientPhone.length > 3 && phoneDigits.includes(clientPhone)) return true;
        if (clientIdDigits.length > 3 && phoneDigits.includes(clientIdDigits)) return true;

        return false;
      });

      resolve(matched);
    }, 200);
  });
}

/**
 * Cancel a booking in localStorage.
 */
export function mockCancelBooking(id: string, _phone: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const all = loadMockBookings();
      const idx = all.findIndex(b => b.id === id);
      if (idx === -1) {
        reject(new Error('Запись не найдена'));
        return;
      }
      if (!['pending', 'confirmed'].includes(all[idx].status)) {
        reject(new Error('Эту запись нельзя отменить'));
        return;
      }
      all[idx] = { ...all[idx], status: 'cancelled' };
      saveMockBookings(all);
      resolve();
    }, 200);
  });
}
