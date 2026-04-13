/**
 * Business API functions
 * All backend responses are wrapped in { data: ... } — we unwrap here.
 */
import { Business, Master, Service, PaginatedResponse, FetchBusinessesParams } from './types';
/**
 * Fetch list of businesses with optional filtering.
 * Backend: GET /businesses → { data: Business[], total: number }
 */
export declare function fetchBusinesses(params?: FetchBusinessesParams): Promise<PaginatedResponse<Business>>;
/**
 * Fetch single business by ID.
 * Backend: GET /businesses/:id → { data: Business }
 */
export declare function fetchBusiness(id: string): Promise<Business>;
/**
 * Fetch all masters for a business.
 * Backend: GET /businesses/:id/masters → { data: Master[] }
 */
export declare function fetchBusinessMasters(businessId: string): Promise<Master[]>;
/**
 * Fetch all services for a business.
 * Backend: GET /businesses/:id/services → { data: Service[] }
 */
export declare function fetchBusinessServices(businessId: string): Promise<Service[]>;
//# sourceMappingURL=businesses.d.ts.map