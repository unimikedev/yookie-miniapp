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

interface ClientStatsResponse {
  data: ClientStats;
}

/**
 * Fetch client statistics
 */
export async function fetchClientStats(phone?: string): Promise<ClientStats> {
  const params: Record<string, unknown> = {};
  if (phone) params.phone = phone;

  const response = await api.get<ClientStatsResponse>('/clients/me/stats', params);
  return response.data;
}
