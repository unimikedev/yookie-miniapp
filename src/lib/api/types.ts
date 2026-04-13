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
  name: string;
  description: string;
  category: CategoryEnum;
  address: string;
  city: string;
  phone: string;
  instagram?: string;
  telegram_username?: string;
  working_hours: Record<string, { open: string; close: string }>;
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
  working_days: string[] | Record<string, boolean>;
  breaks?: Array<{ start: string; end: string }>;
  is_active: boolean;
  position: number | string;
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
  price?: number; // Override price if set
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
  starts_at: string; // ISO datetime
  ends_at: string; // ISO datetime
  status: BookingStatus;
  price: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Populated when fetched with ?include=relations
  businesses?: { id: string; name: string; address?: string; phone?: string; category?: string };
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
  user: Client;
}

export interface CreateBookingPayload {
  businessId: string;
  masterId: string;
  serviceId: string;
  startsAt: string;
  clientPhone: string;
  clientName: string;
  notes?: string;
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
