/**
 * Hook for fetching visited masters for the home page "Вы посещали" section.
 */

import { useState, useEffect } from 'react';
import { fetchVisitedMasters, type VisitedBusiness } from '@/lib/api/visited';
import { useAuthStore } from '@/stores/authStore';

interface UseVisitedMastersResult {
  visited: VisitedBusiness[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useVisitedMasters(): UseVisitedMastersResult {
  const [visited, setVisited] = useState<VisitedBusiness[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const authStore = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    const phone = authStore.isAuthenticated && authStore.phone
      ? authStore.phone
      : localStorage.getItem('yookie_booking_phone');

    if (!phone) {
      setIsLoading(false);
      setVisited([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchVisitedMasters(phone, 8)
      .then((res) => {
        if (!cancelled) {
          setVisited(res ?? []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch visited'));
          setVisited([]);
          setIsLoading(false);
        }
      });

    return () => { cancelled = true };
  }, [tick, authStore.phone, authStore.isAuthenticated]);

  return {
    visited,
    isLoading,
    error,
    refetch: () => setTick((t) => t + 1),
  };
}
