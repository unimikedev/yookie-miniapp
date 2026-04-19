import { useMemo } from 'react';

interface PriceFilter {
  min?: number;
  max?: number;
}

interface RatingFilter {
  min?: number; // 0-5
}

interface DistanceFilter {
  max?: number; // in km
}

interface Business {
  id: string;
  name: string;
  rating?: number;
  priceRange?: number; // 1-4
  distance?: number;
  categoryIds?: string[];
}

interface UseBusinessFiltersProps {
  businesses: Business[];
  priceFilter?: PriceFilter;
  ratingFilter?: RatingFilter;
  distanceFilter?: DistanceFilter;
  categoryFilter?: string[];
}

export const useBusinessFilters = ({
  businesses,
  priceFilter,
  ratingFilter,
  distanceFilter,
  categoryFilter,
}: UseBusinessFiltersProps) => {
  const filteredBusinesses = useMemo(() => {
    return businesses.filter(business => {
      // Price filter
      if (priceFilter) {
        const businessPrice = business.priceRange || 0;
        if (priceFilter.min !== undefined && businessPrice < priceFilter.min) {
          return false;
        }
        if (priceFilter.max !== undefined && businessPrice > priceFilter.max) {
          return false;
        }
      }

      // Rating filter
      if (ratingFilter) {
        const businessRating = business.rating || 0;
        if (ratingFilter.min !== undefined && businessRating < ratingFilter.min) {
          return false;
        }
      }

      // Distance filter
      if (distanceFilter) {
        const businessDistance = business.distance || Infinity;
        if (distanceFilter.max !== undefined && businessDistance > distanceFilter.max) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter && categoryFilter.length > 0) {
        const businessCategories = business.categoryIds || [];
        const hasMatchingCategory = categoryFilter.some(catId => 
          businessCategories.includes(catId)
        );
        if (!hasMatchingCategory) {
          return false;
        }
      }

      return true;
    });
  }, [businesses, priceFilter, ratingFilter, distanceFilter, categoryFilter]);

  const getAppliedFiltersCount = () => {
    let count = 0;
    if (priceFilter && (priceFilter.min !== undefined || priceFilter.max !== undefined)) count++;
    if (ratingFilter && ratingFilter.min !== undefined) count++;
    if (distanceFilter && distanceFilter.max !== undefined) count++;
    if (categoryFilter && categoryFilter.length > 0) count++;
    return count;
  };

  const clearAllFilters = () => {
    // This would be handled by parent component state
    return {};
  };

  return {
    filteredBusinesses,
    totalCount: businesses.length,
    filteredCount: filteredBusinesses.length,
    getAppliedFiltersCount,
    clearAllFilters,
  };
};

// Helper to convert price range label to numeric filter
export const getPriceRangeFromLabel = (label: string): PriceFilter => {
  switch (label) {
    case '$':
      return { max: 1 };
    case '$$':
      return { min: 1, max: 2 };
    case '$$$':
      return { min: 2, max: 3 };
    case '$$$$':
      return { min: 3, max: 4 };
    default:
      return {};
  }
};

// Helper to get rating buckets
export const getRatingBucket = (rating: number): number => {
  if (rating >= 4.5) return 5;
  if (rating >= 4.0) return 4;
  if (rating >= 3.5) return 3;
  if (rating >= 3.0) return 2;
  return 1;
};
