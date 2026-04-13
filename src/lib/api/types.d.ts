/**
 * API Response Types for Yookie Mini App
 */
export type CategoryEnum = 'beauty_salon' | 'barber' | 'nail' | 'brow_lash' | 'spa_massage' | 'fitness' | 'yoga' | 'tattoo' | 'cosmetology' | 'pet_grooming' | 'dentist' | 'photographer' | 'tutor' | 'other';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export declare const CATEGORY_LABELS: Record<CategoryEnum, string>;
export interface Business {
    id: string;
    name: string;
    description: string;
    category: CategoryEnum;
    address: string;
    city: string;
    phone: string;
    instagram?: string;
    telegram_username?: string;
    working_hours: Record<string, {
        open: string;
        close: string;
    }>;
    slot_duration_min: number;
    booking_link?: string;
    is_active: boolean;
    rating?: number;
    lat?: number;
    lng?: number;
    created_at?: string;
    updated_at?: string;
}
export interface Master {
    id: string;
    business_id: string;
    name: string;
    specialization: string;
    bio?: string;
    photo_url?: string;
    rating: number;
    review_count: number;
    working_days: string[];
    breaks?: Array<{
        start: string;
        end: string;
    }>;
    is_active: boolean;
    position: string;
    created_at?: string;
    updated_at?: string;
}
export interface Service {
    id: string;
    business_id: string;
    name: string;
    description?: string;
    price: number;
    duration_min: number;
    category: string;
    is_active: boolean;
    position: number;
    created_at?: string;
    updated_at?: string;
}
export interface MasterService {
    master_id: string;
    service_id: string;
    price?: number;
}
export interface Client {
    id: string;
    telegram_id: bigint;
    phone: string;
    name: string;
    lead_source?: string;
    created_at?: string;
    updated_at?: string;
}
export interface Booking {
    id: string;
    business_id: string;
    master_id: string;
    service_id: string;
    client_id: string;
    starts_at: string;
    ends_at: string;
    status: BookingStatus;
    price: number;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}
export interface Review {
    id: string;
    business_id: string;
    master_id: string;
    client_id: string;
    booking_id: string;
    rating: number;
    comment?: string;
    is_visible: boolean;
    created_at?: string;
    updated_at?: string;
}
export interface TimeSlot {
    id?: string;
    start: string;
    end: string;
    is_available: boolean;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    has_next: boolean;
    has_prev: boolean;
}
export interface ApiErrorResponse {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}
export declare class ApiError extends Error {
    statusCode: number;
    code: string;
    details?: Record<string, unknown> | undefined;
    constructor(statusCode: number, code: string, message: string, details?: Record<string, unknown> | undefined);
}
export interface RequestOtpPayload {
    phone: string;
}
export interface VerifyOtpPayload {
    phone: string;
    code: string;
}
export interface VerifyOtpResponse {
    token: string;
    user: Client;
}
export interface CreateBookingPayload {
    businessId: string;
    masterId: string;
    serviceId: string;
    startsAt: string;
    clientPhone: string;
    clientName: string;
}
export interface CancelBookingPayload {
    phone: string;
}
export interface FetchBusinessesParams {
    city?: string;
    category?: CategoryEnum;
    search?: string;
    page?: number;
    limit?: number;
}
//# sourceMappingURL=types.d.ts.map