/**
 * Business API functions
 * All backend responses are wrapped in { data: ... } — we unwrap here.
 */

import { api } from './client';
import {
  Business,
  Master,
  Service,
  PaginatedResponse,
  FetchBusinessesParams,
} from './types';

/**
 * Fetch list of businesses with optional filtering.
 * Backend: GET /businesses → { data: Business[], total: number }
 */
export async function fetchBusinesses(
  params: FetchBusinessesParams = {}
): Promise<PaginatedResponse<Business>> {
  const queryParams: Record<string, unknown> = {};

  if (params.city) queryParams.city = params.city;
  if (params.category) queryParams.category = params.category;
  if (params.search) queryParams.search = params.search;
  if (params.page !== undefined) queryParams.page = params.page;
  if (params.limit !== undefined) queryParams.limit = params.limit;

  const response = await api.get<PaginatedResponse<Business>>('/businesses', queryParams);
  return response;
}

/**
 * Fetch single business by ID.
 * Backend: GET /businesses/:id → { data: Business }
 */
export async function fetchBusiness(id: string): Promise<Business> {
  const response = await api.get<{ data: Business }>(`/businesses/${id}`);
  return response.data;
}

/**
 * Fetch all masters for a business.
 * Backend: GET /businesses/:id/masters → { data: Master[] }
 */
export async function fetchBusinessMasters(businessId: string): Promise<Master[]> {
  const response = await api.get<{ data: Master[] }>(`/businesses/${businessId}/masters`);
  if (import.meta.env.DEV) {
    console.log(`[fetchBusinessMasters] businessId=${businessId}, response keys=${response ? Object.keys(response) : 'null'}, data length=${response.data?.length ?? 'null'}`);
    if (response.data && response.data.length > 0) {
      console.log(`[fetchBusinessMasters] first master:`, JSON.stringify(response.data[0]).substring(0, 200));
    }
  }
  return response.data ?? [];
}

/**
 * Fetch all services for a business.
 * Backend: GET /businesses/:id/services → { data: Service[] }
 */
export async function fetchBusinessServices(businessId: string): Promise<Service[]> {
  const response = await api.get<{ data: Service[] }>(`/businesses/${businessId}/services`);
  return response.data ?? [];
}
