/**
 * Reviews API functions
 * POST /reviews, GET /businesses/:id/reviews
 */

import { api } from './client';
import type { Review } from './types';

interface BackendReview {
  id: string;
  business_id: string;
  master_id: string;
  client_id: string;
  booking_id: string;
  rating: number;
  comment: string | null;
  is_visible: boolean;
  created_at: string;
  clients: { id: string; name: string | null } | null;
  masters: { id: string; name: string } | null;
}

interface ReviewsResponse {
  data: BackendReview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Fetch reviews for a business (paginated)
 */
export async function fetchBusinessReviews(
  businessId: string,
  page = 1,
  limit = 20
): Promise<ReviewsResponse> {
  const response = await api.get<ReviewsResponse>(
    `/businesses/${businessId}/reviews`,
    { page, limit }
  );
  return response;
}

/**
 * Create a review for a completed booking
 */
export async function createReview(data: {
  bookingId: string;
  rating: number;
  comment?: string;
  phone: string;
}): Promise<Review> {
  const response = await api.post<{ data: Review }>('/reviews', {
    bookingId: data.bookingId,
    rating: data.rating,
    comment: data.comment,
    phone: data.phone,
  });
  return response.data;
}
