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
  NearbyBusinessResult,
  RouteResult,
} from './types';

/**
 * Fetch list of businesses with optional filtering and geo-search.
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
  if (params.lat !== undefined) queryParams.lat = params.lat;
  if (params.lng !== undefined) queryParams.lng = params.lng;
  if (params.radius !== undefined) queryParams.radius = params.radius;
  if (params.sort) queryParams.sort = params.sort;
  if (params.priceMin !== undefined) queryParams.priceMin = params.priceMin;
  if (params.priceMax !== undefined) queryParams.priceMax = params.priceMax;
  if (params.minRating !== undefined) queryParams.minRating = params.minRating;

  const response = await api.get<PaginatedResponse<Business>>('/businesses', queryParams);
  return response;
}

/**
 * Fetch businesses sorted by distance from user position.
 * Returns enriched business objects with distance_km, min_price, etc.
 */
export async function fetchNearbyBusinesses(
  params: FetchBusinessesParams & { lat: number; lng: number }
): Promise<{ data: NearbyBusinessResult[]; total: number }> {
  const queryParams: Record<string, unknown> = {
    lat: params.lat,
    lng: params.lng,
    sort: params.sort ?? 'distance',
    limit: params.limit ?? 50,
  };

  if (params.radius !== undefined) queryParams.radius = params.radius;
  if (params.category) queryParams.category = params.category;
  if (params.search) queryParams.search = params.search;
  if (params.priceMin !== undefined) queryParams.priceMin = params.priceMin;
  if (params.priceMax !== undefined) queryParams.priceMax = params.priceMax;
  if (params.minRating !== undefined) queryParams.minRating = params.minRating;

  return api.get<{ data: NearbyBusinessResult[]; total: number }>('/businesses', queryParams);
}

/**
 * Fetch walking/driving route between two points.
 * Backend: GET /geo/route → { data: RouteResult }
 */
export async function fetchRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  mode: 'walking' | 'driving' = 'walking'
): Promise<RouteResult> {
  const response = await api.get<{ data: RouteResult }>('/geo/route', {
    fromLat: from.lat,
    fromLng: from.lng,
    toLat: to.lat,
    toLng: to.lng,
    mode,
  });
  return response.data;
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
