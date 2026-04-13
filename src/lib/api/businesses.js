/**
 * Business API functions
 * All backend responses are wrapped in { data: ... } — we unwrap here.
 */
import { api } from './client';
/**
 * Fetch list of businesses with optional filtering.
 * Backend: GET /businesses → { data: Business[], total: number }
 */
export async function fetchBusinesses(params = {}) {
    const queryParams = {};
    if (params.city)
        queryParams.city = params.city;
    if (params.category)
        queryParams.category = params.category;
    if (params.search)
        queryParams.search = params.search;
    if (params.page !== undefined)
        queryParams.page = params.page;
    if (params.limit !== undefined)
        queryParams.limit = params.limit;
    const response = await api.get('/businesses', queryParams);
    return response;
}
/**
 * Fetch single business by ID.
 * Backend: GET /businesses/:id → { data: Business }
 */
export async function fetchBusiness(id) {
    const response = await api.get(`/businesses/${id}`);
    return response.data;
}
/**
 * Fetch all masters for a business.
 * Backend: GET /businesses/:id/masters → { data: Master[] }
 */
export async function fetchBusinessMasters(businessId) {
    const response = await api.get(`/businesses/${businessId}/masters`);
    return response.data ?? [];
}
/**
 * Fetch all services for a business.
 * Backend: GET /businesses/:id/services → { data: Service[] }
 */
export async function fetchBusinessServices(businessId) {
    const response = await api.get(`/businesses/${businessId}/services`);
    return response.data ?? [];
}
//# sourceMappingURL=businesses.js.map