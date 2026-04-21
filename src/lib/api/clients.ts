/**
 * Client API functions
 * GET /clients/me, GET /clients/me/visited, GET /clients/me/stats
 */

import { api } from './client';

export interface ClientStats {
  joinedAt: string;
  totalBookings: number;
  loyaltyPoints: number;
  totalSpent: number;
}

/**
 * Fetch client statistics
 * Backend: GET /clients/me/stats → { data: ClientStats }
 * API client unwraps the outer { data: ... }, so we receive ClientStats directly.
 */
export async function fetchClientStats(phone?: string): Promise<ClientStats> {
  const params: Record<string, unknown> = {};
  if (phone) params.phone = phone;

  const response = await api.get<ClientStats>('/clients/me/stats', params);
  return response;
}
