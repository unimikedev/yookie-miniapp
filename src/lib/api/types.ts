/**
 * API Response Types for Yookie Mini App
 */

export type CategoryEnum =
  | 'hair'
  | 'nail'
  | 'brow_lash'
  | 'makeup'
  | 'spa_massage'
  | 'epilation'
  | 'cosmetology'
  | 'barber'
  | 'tattoo'
  | 'piercing'
  | 'yoga'
  | 'fitness'
  | 'other';

export type ProviderType = 'business' | 'individual';
// 'business'   = салон/студия (несколько специалистов)
// 'individual' = частный мастер (он сам = единственный специалист)

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export const CATEGORY_LABELS: Record<CategoryEnum, string> = {
  hair: 'Волосы',
  nail: 'Ногти',
  brow_lash: 'Брови и ресницы',
  makeup: 'Макияж',
  spa_massage: 'СПА и массаж',
  epilation: 'Эпиляция',
  cosmetology: 'Косметология',
  barber: 'Барбершоп',
  tattoo: 'Тату',
  piercing: 'Пирсинг',
  yoga: 'Йога',
  fitness: 'Фитнес',
  other: 'Другое',
};

export interface Business {
  id: string;
  provider_type: ProviderType;
  name: string;
  description: string;
  category: CategoryEnum;
  address: string;
  city: string;
  phone: string;
  instagram?: string;
  instagram_post_urls?: string[];
  telegram_username?: string;
  working_hours: Record<string, { open: string; close: string }>;
  slot_duration_min: number;
  booking_link?: string;
  is_active: boolean;
  photo_url?: string | null;
  photo_urls?: string[] | null;
  rating?: number;
  review_count?: number;
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
  working_days: string[] | Record<string, boolean>;
  breaks?: Array<{ start: string; end: string }>;
  is_active: boolean;
  position: number | string;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
  master_services?: Array<{
    service_id: string;
    price?: number;
    services?: {
      id: string;
      name: string;
      price: number;
      duration_min: number;
      category?: string;
    };
  }>;
  user_accounts?: {
    id: string;
    name: string;
    phone: string;
    avatar_url?: string | null;
    role: string;
  } | null;
}

export interface ServiceAddon {
  id: string;
  service_id: string;
  name: string;
  price: number;
  duration_min: number;
  max_qty: number;
  position: number;
  is_active: boolean;
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
  addons?: ServiceAddon[];
  created_at?: string;
  updated_at?: string;
}

export interface MasterService {
  master_id: string;
  service_id: string;
  price?: number; // Override price if set
}

export interface Client {
  id: string;
  telegram_id?: bigint | number;
  phone: string;
  name: string;
  lead_source?: string;
  telegram_username?: string;
  last_visit?: string;
  total_bookings?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Booking {
  id: string;
  business_id: string;
  master_id: string;
  service_id: string;
  client_id: string;
  starts_at: string; // ISO datetime
  ends_at: string; // ISO datetime
  status: BookingStatus;
  price: number;
  notes?: string;
  rescheduled?: boolean; // true если запись была перенесена
  /** Links all bookings created in one session (batch or single). Enables reliable group display. */
  booking_group_id?: string;
  created_at?: string;
  updated_at?: string;
  // Populated when fetched with ?include=relations
  businesses?: { id: string; name: string; address?: string; phone?: string; category?: string; logo_url?: string; cover_photo_url?: string };
  masters?: { id: string; name: string; photo_url?: string };
  services?: { id: string; name: string; price?: number; duration_min?: number };
  clients?: { id: string; name: string; phone: string; telegram_id?: number };
}

export interface Review {
  id: string;
  business_id: string;
  master_id: string;
  client_id: string;
  booking_id: string;
  rating: number; // 1-5
  comment?: string;
  is_visible: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TimeSlot {
  id?: string;
  start: string; // ISO datetime or HH:mm
  end: string; // ISO datetime or HH:mm
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

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Request payloads
export interface RequestOtpPayload {
  phone: string;
}

export interface VerifyOtpPayload {
  phone: string;
  code: string;
}

export interface VerifyOtpResponse {
  token: string;
  isNewUser?: boolean;
  user: {
    id: string;
    phone: string;
    name: string;
    businessId?: string | null;
    role?: string;
  };
}

export interface GoogleAuthResponse {
  token: string;
  isNewUser?: boolean;
  user: {
    id: string;
    phone: string | null;
    email: string;
    name: string;
    businessId?: string | null;
    role?: string;
    avatarUrl?: string | null;
  };
}

export interface CreateBookingPayload {
  businessId: string;
  masterId: string;
  serviceId: string;
  startsAt: string;
  clientPhone: string;
  clientName: string;
  notes?: string;
  telegramId?: number;
  addons?: Array<{ addonId: string; qty: number }>;
}

export interface CancelBookingPayload {
  phone: string;
}

export interface FetchBusinessesParams {
  city?: string;
  category?: CategoryEnum;
  search?: string;
  page?: number;
  offset?: number;
  limit?: number;
  /** Geo-search params */
  lat?: number;
  lng?: number;
  radius?: number; // km
  sort?: 'rating' | 'price_asc' | 'price_desc' | 'popular' | 'distance';
  priceMin?: number;
  priceMax?: number;
  minRating?: number;
}

/** Business with computed distance (returned from geo-search) */
export interface NearbyBusinessResult extends Business {
  rating: number;
  review_count: number;
  min_price: number;
  distance_km: number | null;
  masters: Master[];
}

export interface RouteResult {
  distance_km: number | null;
  duration_min: number | null;
  polyline: [number, number][] | null;
  source: 'yandex' | 'estimate';
}

/**
 * B2B Merchant Types
 */
export interface Merchant {
  id: string;
  business_name: string;
  business_type: 'salon' | 'individual';
  category: CategoryEnum;
  address: string;
  city: string;
  phone: string;
  description: string;
  instagram?: string;
  telegram_username?: string;
  logo_url?: string;
  cover_photo_url?: string;
  photo_urls?: string[];
  is_active: boolean;
  is_verified: boolean;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface MerchantStaff {
  id: string;
  merchant_id: string;
  name: string;
  specialization: string;
  phone?: string;
  photo_url?: string;
  is_active: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface MerchantService {
  id: string;
  merchant_id: string;
  name: string;
  description?: string;
  price: number;
  duration_min: number;
  category: string;
  is_active: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface MerchantAvailability {
  id: string;
  merchant_id: string;
  day_of_week: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  open_time: string; // HH:mm
  close_time: string; // HH:mm
  is_open: boolean;
  created_at: string;
  updated_at: string;
}

export interface MerchantBooking {
  id: string;
  merchant_id: string;
  staff_id?: string;
  service_id: string;
  client_id: string;
  client_name: string;
  client_phone: string;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  price: number;
  notes?: string;
  source: 'online' | 'offline' | 'manual';
  created_at: string;
  updated_at: string;
  // Populated relations
  staff?: MerchantStaff;
  service?: MerchantService;
}

export interface MerchantClient {
  id: string;
  merchant_id: string;
  name: string;
  phone: string;
  telegram_id?: bigint;
  total_bookings: number;
  last_visit?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Standardized API Response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  success?: boolean;
  message?: string;
}

/**
 * Booking creation request payload (typed)
 */
export interface CreateBookingRequest {
  businessId: string;
  masterId: string;
  serviceId: string;
  startsAt: string;
  client: {
    phone: string;
    name: string;
    telegramId?: number;
  };
  notes?: string;
}

/**
 * User authentication response (typed)
 */
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    phone: string;
    name: string;
    email?: string | null;
    avatarUrl?: string | null;
    businessId?: string | null;
    role?: string;
  };
  isNewUser?: boolean;
}
