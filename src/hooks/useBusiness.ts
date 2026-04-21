/**
 * Hook for fetching a single business with its masters and services
 */

import { useState, useEffect } from 'react';
import { fetchBusiness, fetchBusinessMasters, fetchBusinessServices } from '../lib/api/businesses';
import { Business, Master, Service, ApiError } from '../lib/api/types';
import { getMockBusiness, getMockMasters, getMockServices } from '../lib/mockBusinesses';

interface UseBusinessResult {
  business: Business | null;
  masters: Master[];
  services: Service[];
  isLoading: boolean;
  error: ApiError | null;
}

export function useBusiness(businessId: string | undefined): UseBusinessResult {
  const [business, setBusiness] = useState<Business | null>(null);
  const [masters, setMasters] = useState<Master[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!businessId) {
      setBusiness(null);
      setMasters([]);
      setServices([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch all data in parallel
        const [businessData, mastersData, servicesData] = await Promise.all([
          fetchBusiness(businessId),
          fetchBusinessMasters(businessId),
          fetchBusinessServices(businessId),
        ]);

        if (!controller.signal.aborted) {
          // If API returned empty/null data, fall back to mock (DEV only)
          const hasRealData = businessData && mastersData && mastersData.length > 0;
          if (import.meta.env.DEV && !hasRealData) {
            const mockBiz = getMockBusiness(businessId);
            if (mockBiz) {
              setBusiness(businessData ?? mockBiz);
              setMasters(getMockMasters(businessId));
              setServices(getMockServices(businessId));
            } else {
              setBusiness(businessData);
              setMasters(mastersData);
              setServices(servicesData);
            }
          } else {
            setBusiness(businessData);
            setMasters(mastersData);
            setServices(servicesData);
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          // In DEV mode, fall back to mock data so the UI always shows something
          if (import.meta.env.DEV) {
            const mockBiz = getMockBusiness(businessId);
            if (mockBiz) {
              setBusiness(mockBiz);
              setMasters(getMockMasters(businessId));
              setServices(getMockServices(businessId));
            } else {
              if (err instanceof ApiError) {
                setError(err);
              } else {
                setError(new ApiError(0, 'UNKNOWN_ERROR', err instanceof Error ? err.message : 'Failed to fetch business'));
              }
            }
          } else {
            // Production — show real error, do NOT return fake data
            if (err instanceof ApiError) {
              setError(err);
            } else {
              setError(new ApiError(0, 'UNKNOWN_ERROR', err instanceof Error ? err.message : 'Failed to fetch business'));
            }
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
  }, [businessId]);

  return {
    business,
    masters,
    services,
    isLoading,
    error,
  };
}
