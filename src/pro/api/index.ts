/**
 * Pro (B2B) API layer.
 *
 * Thin wrapper around the shared `@/lib/api` module. B2B operates on the
 * SAME entities as B2C (Bookings, Services, Masters/Staff, Clients), so
 * endpoints are prefixed under `/merchants/:merchantId/...` on the backend
 * but return the canonical shared types.
 *
 * Backend endpoints listed here are the target contract. Where the backend
 * is not yet implemented, the calls will fail and callers fall back to a
 * mock layer (see `proMocks.ts`). This mirrors the approach used in
 * `@/lib/api/bookings.ts`.
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

// ─── Reads ────────────────────────────────────────────────────────────────────
export async function listBookings(
  merchantId: string,
  params: { from: string; to: string }
): Promise<Booking[]> {
  try {
    const res = await api.get<{ data: Booking[] }>(
      `/merchants/${merchantId}/bookings`,
      params
    );
    return res.data ?? [];
  } catch {
    return mockListMerchantBookings(merchantId, params);
  }
}

export async function listServices(merchantId: string): Promise<Service[]> {
  try {
    const res = await api.get<{ data: Service[] }>(`/merchants/${merchantId}/services`);
    return res.data ?? [];
  } catch {
    return mockListMerchantServices(merchantId);
  }
}

export async function listStaff(merchantId: string): Promise<Master[]> {
  try {
    const res = await api.get<{ data: Master[] }>(`/merchants/${merchantId}/staff`);
    return res.data ?? [];
  } catch {
    return mockListMerchantStaff(merchantId);
  }
}

export async function listClients(merchantId: string): Promise<Client[]> {
  try {
    const res = await api.get<{ data: Client[] }>(`/merchants/${merchantId}/clients`);
    return res.data ?? [];
  } catch {
    return mockListMerchantClients(merchantId);
  }
}

export async function dashboardSummary(merchantId: string, date: string) {
  try {
    return await api.get<{
      data: {
        bookingsCount: number;
        revenuePlaceholder: number;
        loadPercent: number;
        emptySlots: number;
        cancellations: number;
      };
    }>(`/merchants/${merchantId}/dashboard`, { date }).then((r) => r.data);
  } catch {
    return mockDashboardSummary(merchantId, date);
  }
}

// ─── Writes ───────────────────────────────────────────────────────────────────
export async function updateBookingStatus(
  merchantId: string,
  bookingId: string,
  status: BookingStatus
): Promise<Booking> {
  try {
    const res = await api.post<{ data: Booking }>(
      `/merchants/${merchantId}/bookings/${bookingId}/status`,
      { status }
    );
    return res.data;
  } catch {
    return mockUpdateBookingStatus(merchantId, bookingId, status);
  }
}

export async function rescheduleBooking(
  merchantId: string,
  bookingId: string,
  patch: { startsAt?: string; endsAt?: string; masterId?: string }
): Promise<Booking> {
  try {
    const res = await api.post<{ data: Booking }>(
      `/merchants/${merchantId}/bookings/${bookingId}/reschedule`,
      patch
    );
    return res.data;
  } catch {
    return mockRescheduleBooking(merchantId, bookingId, patch);
  }
}

export type ServiceInput = Partial<Service> & {
  name: string;
  price: number;
  duration_min: number;
};

export async function upsertService(
  merchantId: string,
  input: ServiceInput
): Promise<Service> {
  try {
    if (input.id) {
      const res = await api.post<{ data: Service }>(
        `/merchants/${merchantId}/services/${input.id}`,
        input
      );
      return res.data;
    }
    const res = await api.post<{ data: Service }>(
      `/merchants/${merchantId}/services`,
      input
    );
    return res.data;
  } catch {
    return mockUpsertService(merchantId, input);
  }
}

export async function deleteService(merchantId: string, serviceId: string): Promise<void> {
  try {
    await api.post<unknown>(`/merchants/${merchantId}/services/${serviceId}/delete`, {});
  } catch {
    await mockDeleteService(merchantId, serviceId);
  }
}

export type StaffInput = Partial<Master> & { name: string; specialization: string };

export async function upsertStaff(
  merchantId: string,
  input: StaffInput
): Promise<Master> {
  try {
    if (input.id) {
      const res = await api.post<{ data: Master }>(
        `/merchants/${merchantId}/staff/${input.id}`,
        input
      );
      return res.data;
    }
    const res = await api.post<{ data: Master }>(
      `/merchants/${merchantId}/staff`,
      input
    );
    return res.data;
  } catch {
    return mockUpsertStaff(merchantId, input);
  }
}

export async function deleteStaff(merchantId: string, staffId: string): Promise<void> {
  try {
    await api.post<unknown>(`/merchants/${merchantId}/staff/${staffId}/delete`, {});
  } catch {
    await mockDeleteStaff(merchantId, staffId);
  }
}

export interface AvailabilityDay {
  weekday: number; // 0 = Sun ... 6 = Sat
  open: string; // "HH:mm"
  close: string; // "HH:mm"
  enabled: boolean;
}

export async function updateAvailability(
  merchantId: string,
  staffId: string,
  days: AvailabilityDay[]
): Promise<AvailabilityDay[]> {
  try {
    const res = await api.post<{ data: AvailabilityDay[] }>(
      `/merchants/${merchantId}/staff/${staffId}/availability`,
      { days }
    );
    return res.data;
  } catch {
    return mockUpdateAvailability(merchantId, staffId, days);
  }
}
