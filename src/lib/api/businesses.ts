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
 * ApiClient unwraps { data: X } → returns X. Since backend sends { data: [...], total: N },
 * we receive [...] (the array) directly. Normalize to PaginatedResponse here.
 */
export async function fetchBusinesses(
  params: FetchBusinessesParams = {}
): Promise<PaginatedResponse<Business>> {
  const queryParams: Record<string, unknown> = {};

  if (params.city) queryParams.city = params.city;
  if (params.category) queryParams.category = params.category;
  if (params.search) queryParams.search = params.search;
  if (params.page !== undefined) queryParams.page = params.page;
  if (params.offset !== undefined) queryParams.offset = params.offset;
  if (params.limit !== undefined) queryParams.limit = params.limit;
  if (params.lat !== undefined) queryParams.lat = params.lat;
  if (params.lng !== undefined) queryParams.lng = params.lng;
  if (params.radius !== undefined) queryParams.radius = params.radius;
  if (params.sort) queryParams.sort = params.sort;
  if (params.priceMin !== undefined) queryParams.priceMin = params.priceMin;
  if (params.priceMax !== undefined) queryParams.priceMax = params.priceMax;
  if (params.minRating !== undefined) queryParams.minRating = params.minRating;

  const raw = await api.get<unknown>('/businesses', queryParams);

  // ApiClient unwraps one { data: X } level. Backend returns { data: [...], total: N }
  // so we receive the array directly. Normalize to PaginatedResponse.
  if (Array.isArray(raw)) {
    const businesses = raw as Business[];
    return { data: businesses, total: businesses.length, page: 0, limit: params.limit ?? 20, has_next: false, has_prev: false };
  }
  // Already a PaginatedResponse (e.g. if backend is updated to double-wrap)
  return raw as PaginatedResponse<Business>;
}

/**
 * Fetch businesses sorted by distance from user position.
 * Returns enriched business objects with distance_km, min_price, etc.
 * Backend: GET /businesses?lat=&lng=... → { data: NearbyBusinessResult[]; total: number }
 * API client unwraps the outer { data: ... }, so we receive { data: [], total: N } directly.
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

  const raw = await api.get<unknown>('/businesses', queryParams);
  // Same unwrap issue: API client strips { data: X } → returns array directly.
  const items = Array.isArray(raw) ? (raw as NearbyBusinessResult[]) : ((raw as { data?: NearbyBusinessResult[] })?.data ?? []);
  return { data: items, total: items.length };
}

/**
 * Fetch walking/driving route between two points.
 * Backend: GET /geo/route → { data: RouteResult }
 * API client unwraps the outer { data: ... }, so we receive RouteResult directly.
 */
export async function fetchRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  mode: 'walking' | 'driving' = 'walking'
): Promise<RouteResult> {
  const response = await api.get<RouteResult>('/geo/route', {
    fromLat: from.lat,
    fromLng: from.lng,
    toLat: to.lat,
    toLng: to.lng,
    mode,
  });
  return response;
}

/**
 * Fetch single business by ID.
 * Backend: GET /businesses/:id → { data: Business }
 * API client unwraps the outer { data: ... }, so we receive Business directly.
 */
export async function fetchBusiness(id: string): Promise<Business> {
  const response = await api.get<Business>(`/businesses/${id}`);
  return response;
}

/**
 * Fetch all masters for a business.
 * Backend: GET /businesses/:id/masters → { data: Master[] }
 * API client unwraps the outer { data: ... }, so we receive Master[] directly.
 */
export async function fetchBusinessMasters(businessId: string): Promise<Master[]> {
  const response = await api.get<Master[]>(`/businesses/${businessId}/masters`);
  return response ?? [];
}

/**
 * Fetch all services for a business.
 * Backend: GET /businesses/:id/services → { data: Service[] }
 * API client unwraps the outer { data: ... }, so we receive Service[] directly.
 */
export async function fetchBusinessServices(businessId: string): Promise<Service[]> {
  const response = await api.get<Service[]>(`/businesses/${businessId}/services`);
  return response ?? [];
}
