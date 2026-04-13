/**
 * Hook for fetching available time slots.
 * Falls back to generated mock slots when the API returns empty.
 */

import { useState, useEffect } from 'react';
import { fetchSlots } from '../lib/api/bookings';
import { TimeSlot, ApiError } from '../lib/api/types';

// Simple string hash → number in [0, 1)
function hashFraction(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return (h >>> 0) / 0xffffffff;
}

/**
 * Generate deterministic mock slots for a given date + masterId.
 * Produces 30-min intervals 09:00–19:30, ~75% available.
 */
function generateMockSlots(masterId: string, date: string): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let hour = 9; hour < 20; hour++) {
    for (const minute of [0, 30]) {
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const key = `${masterId}:${date}:${time}`;
      const available = hashFraction(key) > 0.25;
      slots.push({
        id: `${date}T${time}:00`,
        start: time,
        end: time,
        is_available: available,
      });
    }
  }
  return slots;
}

interface UseSlotsResult {
  slots: TimeSlot[];
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

export function useSlots(
  businessId: string | undefined,
  masterId: string | undefined,
  date: string | undefined
): UseSlotsResult {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!businessId || !masterId || !date) {
      setSlots([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const slotsData = await fetchSlots(businessId, masterId, date);

        if (!controller.signal.aborted) {
          // Use API data when available; fall back to mock slots if empty (DEV only)
          if (slotsData.length > 0) {
            setSlots(slotsData);
          } else if (import.meta.env.DEV) {
            setSlots(generateMockSlots(masterId, date));
          } else {
            setSlots([]);
          }
        }
      } catch (_err) {
        // On any API error, degrade gracefully to mock slots (DEV only)
        if (!controller.signal.aborted) {
          if (import.meta.env.DEV) {
            setSlots(generateMockSlots(masterId, date));
          } else {
            setSlots([]);
            setError(_err instanceof ApiError ? _err : new ApiError(0, 'UNKNOWN_ERROR', 'Failed to fetch slots'));
          }
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetch();

    return () => {
      controller.abort();
    };
  }, [businessId, masterId, date]);

  const refetch = async () => {
    if (!businessId || !masterId || !date) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const slotsData = await fetchSlots(businessId, masterId, date);
      if (slotsData.length > 0) {
        setSlots(slotsData);
      } else if (import.meta.env.DEV) {
        setSlots(generateMockSlots(masterId, date));
      } else {
        setSlots([]);
      }
    } catch (_err) {
      if (import.meta.env.DEV) {
        setSlots(generateMockSlots(masterId, date));
      } else {
        setSlots([]);
        setError(_err instanceof ApiError ? _err : new ApiError(0, 'UNKNOWN_ERROR', 'Failed to fetch slots'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    slots,
    isLoading,
    error,
    refetch,
  };
}
