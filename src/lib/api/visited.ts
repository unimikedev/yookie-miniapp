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

interface VisitedResponse {
  data: VisitedBusiness[];
}

/**
 * Fetch businesses/masters the client has visited
 */
export async function fetchVisitedMasters(phone?: string, limit = 10): Promise<VisitedResponse> {
  const params: Record<string, unknown> = { limit };
  if (phone) params.phone = phone;

  const response = await api.get<VisitedResponse>('/clients/me/visited', params);
  return response;
}
