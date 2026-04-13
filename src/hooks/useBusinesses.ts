/**
 * Hook for fetching businesses list with optional filtering
 */

import { useState, useEffect } from 'react';
import { fetchBusinesses } from '../lib/api/businesses';
import { Business, FetchBusinessesParams, PaginatedResponse, ApiError } from '../lib/api/types';
import { MOCK_BUSINESSES } from '../lib/mockBusinesses';

interface UseBusinessesResult {
  businesses: Business[];
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

export function useBusinesses(params: FetchBusinessesParams = {}): UseBusinessesResult {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(params.page || 1);
  const [limit, setLimit] = useState(params.limit || 10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetch = async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const response: PaginatedResponse<Business> = await fetchBusinesses({
        ...params,
        page,
        limit,
      });

      // Guard against stale responses: if a newer request has already been
      // dispatched (signal aborted by cleanup), discard this result.
      if (signal?.aborted) return;

      setBusinesses(response.data ?? []);
      setTotal(response.total ?? 0);
      if (response.page !== undefined) setPage(response.page);
      if (response.limit !== undefined) setLimit(response.limit);
    } catch (err) {
      if (signal?.aborted) return;
      // In DEV mode, fall back to mock data
      if (import.meta.env.DEV) {
        let filtered = MOCK_BUSINESSES;
        if (params.category) {
          filtered = filtered.filter(b => b.category === params.category);
        }
        if (params.search) {
          const q = params.search.toLowerCase();
          filtered = filtered.filter(
            b => b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q)
          );
        }
        if (params.limit) {
          filtered = filtered.slice(0, params.limit);
        }
        setBusinesses(filtered);
        setTotal(filtered.length);
      } else {
        // Production — clear data, show error
        setBusinesses([]);
        setTotal(0);
        setError(err instanceof ApiError ? err : new ApiError(0, 'UNKNOWN_ERROR', 'Failed to fetch businesses'));
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch(controller.signal);
    return () => {
      controller.abort();
    };
  }, [
    params.city,
    params.category,
    params.search,
    page,
    limit,
  ]);

  const refetch = async () => {
    await fetch();
  };

  return {
    businesses,
    total,
    page,
    limit,
    isLoading,
    error,
    refetch,
  };
}
