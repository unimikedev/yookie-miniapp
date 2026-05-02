/**
 * Hook for fetching user's bookings
 */

import { useState, useEffect } from 'react';
import { fetchMyBookings } from '../lib/api/bookings';
import { Booking, ApiError } from '../lib/api/types';
import { useAuthStore } from '../stores/authStore';

interface UseBookingsResult {
  bookings: Booking[];
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

export function useBookings(): UseBookingsResult {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const authPhone = useAuthStore((state) => state.phone);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const initStatus = useAuthStore((state) => state.initStatus);

  // For non-authenticated users, use the phone from last booking creation
  const getFallbackPhone = (): string | null => {
    try { return localStorage.getItem('yookie_booking_phone'); } catch { return null; }
  };

  // Use auth phone if available, otherwise fall back to booking phone
  const phone = authPhone || getFallbackPhone();

  // Can fetch if we have a phone OR if the user is authenticated (JWT will resolve identity)
  const canFetch = !!phone || isAuthenticated;

  useEffect(() => {
    // Wait for auth to initialize before deciding whether to fetch
    if (initStatus === 'idle' || initStatus === 'loading') return;

    if (!canFetch) {
      setBookings([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Pass phone if known; if null but user is authenticated, JWT in header resolves identity
        const bookingsData = await fetchMyBookings(phone ?? undefined);

        if (!controller.signal.aborted) {
          setBookings(bookingsData);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          if (err instanceof ApiError) {
            setError(err);
          } else {
            const apiError = new ApiError(
              0,
              'UNKNOWN_ERROR',
              err instanceof Error ? err.message : 'Failed to fetch bookings'
            );
            setError(apiError);
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
  }, [phone, canFetch, initStatus]);

  const refetch = async () => {
    const effectivePhone = authPhone || getFallbackPhone();
    if (!effectivePhone && !isAuthenticated) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const bookingsData = await fetchMyBookings(effectivePhone ?? undefined);
      setBookings(bookingsData);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err);
      } else {
        const apiError = new ApiError(
          0,
          'UNKNOWN_ERROR',
          err instanceof Error ? err.message : 'Failed to fetch bookings'
        );
        setError(apiError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    bookings,
    isLoading,
    error,
    refetch,
  };
}
