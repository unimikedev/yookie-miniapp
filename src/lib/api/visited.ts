/**
 * Visited Masters API functions
 * GET /clients/me/visited
 */

import { api } from './client';

export interface VisitedBusiness {
  businessId: string;
  businessName: string;
  businessCategory: string;
  businessAddress: string;
  businessPhotoUrl: string | null;
  visitsCount: number;
  lastVisitAt: string | null;
  masters: Array<{
    id: string;
    name: string;
    specialization: string | null;
    photoUrl: string | null;
    rating: number;
  }>;
}

/**
 * Fetch businesses/masters the client has visited
 * Backend: GET /clients/me/visited → { data: VisitedBusiness[] }
 * API client unwraps the outer { data: ... }, so we receive VisitedBusiness[] directly.
 */
export async function fetchVisitedMasters(phone?: string, limit = 10): Promise<VisitedBusiness[]> {
  const params: Record<string, unknown> = { limit };
  if (phone) params.phone = phone;

  const response = await api.get<VisitedBusiness[]>('/clients/me/visited', params);
  return response ?? [];
}
