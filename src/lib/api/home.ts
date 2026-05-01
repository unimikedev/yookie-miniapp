/**
 * HomePage domain types.
 *
 * Matches the Figma "Главная" frame. These types are platform-agnostic:
 * they describe what the UI needs, not what any one transport delivers.
 * Mapping from Business/Master into these shapes happens inside useHomeData.
 */

import type { CategoryEnum, ProviderType } from './types';

export interface VisitedMasterCard {
  id: string;
  providerType: ProviderType;
  masterName: string;
  businessName: string;
  specialization: string;
  distanceMeters: number;
  priceFrom: number;
  rating: number;
  photoUrl: string | null;
  hasSlotsToday: boolean;
  businessId: string;
  masterId: string;
  lastVisitDate: string;
}

export interface NearbyBusinessCard {
  id: string;
  providerType: ProviderType;
  name: string;
  category: CategoryEnum;
  categoryLabel: string;
  distanceMeters: number;
  priceFrom: number;
  rating: number;
  photoUrl: string | null;
  businessId: string;
  /** Format label for display, e.g. "Барбершоп" */
  formatLabel?: string;
  /** Open until time in HH:mm format, e.g. "00:00" */
  openUntil?: string;
  /** Additional photos for the photo carousel */
  photos?: string[];
}

export interface PopularMasterCard {
  id: string;
  providerType: ProviderType;
  name: string;
  specialization: string;
  distanceMeters: number;
  priceFrom: number;
  rating: number;
  photoUrl: string | null;
  businessId: string;
  masterId: string;
  businessName?: string;
}

export interface PopularStudioCard {
  id: string;
  providerType: ProviderType;
  name: string;
  category: CategoryEnum;
  categoryLabel: string;
  rating: number;
  reviewCount: number;
  photoUrl: string | null;
  /** Additional photos for the swipe carousel */
  photos?: string[];
  businessId: string;
  priceFrom?: number;
  /** Circular logo shown on top-left of card */
  logoUrl?: string | null;
}

export interface MapPreviewCard {
  nearbyCount: number;
}

export interface HomePageData {
  visited: VisitedMasterCard[];
  map: MapPreviewCard;
  nearby: NearbyBusinessCard[];
  popularMasters: PopularMasterCard[];
  popularStudios: PopularStudioCard[];
}

/** UI-level filter chip key used on the HomePage. */
export type HomeFilterKey = 'sort' | 'promo' | 'nearby' | 'available' | 'top_rated' | 'new_places' | 'popular';

export interface HomeFilterChip {
  key: HomeFilterKey;
  label: string;
  icon?: 'arrows';
}
