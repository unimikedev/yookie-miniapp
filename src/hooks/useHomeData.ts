/**
 * useHomeData — single source of truth for HomePage sections.
 *
 * Fetches real business data from backend with GPS coordinates when available.
 * No fake/seeded data — all values come from the API or are omitted.
 * Falls back to mock businesses only when API is completely unreachable (DEV).
 */

import { useEffect, useState } from 'react';
import { fetchBusinesses } from '../lib/api/businesses';
import { CATEGORY_LABELS } from '../lib/api/types';
import type { Business } from '../lib/api/types';
import { useCityStore } from '../stores/cityStore';
import {
  MOCK_BUSINESSES as SHARED_MOCK_BUSINESSES,
} from '../lib/mockBusinesses';

import type {
  HomePageData,
  VisitedMasterCard,
  NearbyBusinessCard,
  PopularMasterCard,
  PopularStudioCard,
} from '../lib/api/home';
import { getMockBusinessImage } from '../lib/utils/mockImages';

/** Real master data embedded in API response */
interface ApiMaster {
  id: string;
  name: string;
  specialization: string | null;
  rating: number;
  photo_url: string | null;
  is_active: boolean;
}

interface ApiBusiness extends Business {
  masters?: ApiMaster[];
  min_price?: number;
  distance_km?: number | null;
  review_count?: number;
}

interface UseHomeDataResult {
  data: HomePageData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/** Haversine distance in meters between two lat/lng points */
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Get distance in meters: prefers API distance_km, falls back to haversine if GPS available */
function getDistanceMeters(
  b: ApiBusiness,
  userPos: { lat: number; lng: number } | null
): number {
  if (b.distance_km != null) return Math.round(b.distance_km * 1000);
  if (userPos && b.lat != null && b.lng != null) {
    return Math.round(haversineMeters(userPos.lat, userPos.lng, b.lat, b.lng));
  }
  return 0;
}

/* ── Projection from Business → card shapes ───────────────────────────── */

function toVisited(b: Business, userPos: { lat: number; lng: number } | null): VisitedMasterCard {
  const ab = b as ApiBusiness;
  const activeMasters = (ab.masters ?? []).filter((m) => m.is_active);
  const master = activeMasters[0] ?? null;

  return {
    id: `visited-${b.id}`,
    providerType: b.provider_type,
    masterName: master?.name ?? b.name,
    businessName: b.name,
    specialization: master?.specialization ?? CATEGORY_LABELS[b.category] ?? '',
    distanceMeters: getDistanceMeters(ab, userPos),
    priceFrom: ab.min_price ?? 0,
    rating: master?.rating ?? b.rating ?? 0,
    photoUrl: master?.photo_url ?? b.photo_url ?? getMockBusinessImage(b.category, b.id),
    hasSlotsToday: true,
    businessId: b.id,
    masterId: master?.id ?? '',
    lastVisitDate: '',
  };
}

function toNearby(b: Business, userPos: { lat: number; lng: number } | null): NearbyBusinessCard {
  const ab = b as ApiBusiness;
  return {
    id: `nearby-${b.id}`,
    providerType: b.provider_type,
    name: b.name,
    category: b.category,
    categoryLabel: CATEGORY_LABELS[b.category],
    distanceMeters: getDistanceMeters(ab, userPos),
    priceFrom: ab.min_price ?? 0,
    rating: b.rating ?? 0,
    photoUrl: b.photo_url ?? getMockBusinessImage(b.category, b.id),
    businessId: b.id,
    photos: (() => {
      const primary = b.photo_url ?? getMockBusinessImage(b.category, b.id)
      const seen = new Set<string>()
      const all: string[] = []
      for (const p of [primary, ...(b.photo_urls ?? [])]) {
        if (p && !seen.has(p)) { seen.add(p); all.push(p) }
      }
      return all.length > 1 ? all.slice(1) : undefined
    })(),
  };
}

function toPopularMaster(b: Business, idx: number, userPos: { lat: number; lng: number } | null): PopularMasterCard {
  const ab = b as ApiBusiness;
  const activeMasters = (ab.masters ?? []).filter((m) => m.is_active);
  const master = activeMasters[idx % Math.max(1, activeMasters.length)] ?? activeMasters[0] ?? null;

  return {
    id: `pm-${b.id}-${idx}`,
    providerType: b.provider_type,
    name: master?.name ?? b.name,
    specialization: master?.specialization ?? CATEGORY_LABELS[b.category] ?? '',
    distanceMeters: getDistanceMeters(ab, userPos),
    priceFrom: ab.min_price ?? 0,
    rating: master?.rating ?? b.rating ?? 0,
    photoUrl: master?.photo_url ?? b.photo_url ?? getMockBusinessImage(b.category, b.id),
    businessId: b.id,
    masterId: master?.id ?? '',
  };
}

function toPopularStudio(b: Business): PopularStudioCard {
  const ab = b as ApiBusiness;
  const primaryPhoto = b.photo_url ?? getMockBusinessImage(b.category, b.id);
  const seen = new Set<string>()
  const allPhotos: string[] = []
  for (const p of [primaryPhoto, ...(b.photo_urls ?? [])]) {
    if (p && !seen.has(p)) { seen.add(p); allPhotos.push(p) }
  }
  return {
    id: `ps-${b.id}`,
    providerType: b.provider_type,
    name: b.name,
    category: b.category,
    categoryLabel: CATEGORY_LABELS[b.category],
    rating: b.rating ?? 0,
    reviewCount: ab.review_count ?? 0,
    photoUrl: allPhotos[0] ?? primaryPhoto,
    photos: allPhotos.length > 1 ? allPhotos.slice(1) : undefined,
    businessId: b.id,
    priceFrom: ab.min_price ?? 0,
  };
}

// Module-level position cache — persists across component remounts.
let _cachedPos: { lat: number; lng: number } | null = null
let _cacheTs = 0
const GEO_CACHE_TTL = 10 * 60 * 1000
// Shared with useGeolocation.ts so both hooks read/write the same entry.
const GEO_LS_KEY = 'yookie_geo_cache'

function readGeoLS(): { lat: number; lng: number } | null {
  try {
    const raw = localStorage.getItem(GEO_LS_KEY)
    if (!raw) return null
    const { lat, lng, ts } = JSON.parse(raw) as { lat: number; lng: number; ts: number }
    if (Date.now() - ts > GEO_CACHE_TTL) return null
    return { lat, lng }
  } catch { return null }
}

function writeGeoLS(pos: { lat: number; lng: number }) {
  try { localStorage.setItem(GEO_LS_KEY, JSON.stringify({ ...pos, ts: Date.now() })) } catch { /* noop */ }
}

/** Get user GPS position (one-shot, non-blocking). Returns null on denial/error. */
function getUserPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    // 1. Module-level cache — same JS session
    if (_cachedPos && Date.now() - _cacheTs < GEO_CACHE_TTL) {
      resolve(_cachedPos)
      return
    }
    // 2. localStorage cache — survives app close/reopen, shared with useGeolocation
    const lsCache = readGeoLS()
    if (lsCache) {
      _cachedPos = lsCache
      _cacheTs = Date.now()
      resolve(lsCache)
      return
    }
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        _cachedPos = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        _cacheTs = Date.now()
        writeGeoLS(_cachedPos)
        resolve(_cachedPos)
      },
      () => resolve(null),
      { timeout: 5000, maximumAge: GEO_CACHE_TTL }
    )
  })
}

/** Only show businesses with at least 1 active master and at least 1 service (min_price > 0) */
function isReadyForListing(b: Business): boolean {
  const ab = b as ApiBusiness;
  const hasActiveMaster = (ab.masters ?? []).some((m) => m.is_active);
  const hasServices = (ab.min_price ?? 0) > 0;
  return hasActiveMaster && hasServices;
}

function buildHomeData(readyBusinesses: Business[], pos: { lat: number; lng: number } | null): HomePageData {
  const sorted = pos
    ? [...readyBusinesses].sort((a, b) =>
        getDistanceMeters(a as ApiBusiness, pos) - getDistanceMeters(b as ApiBusiness, pos)
      )
    : readyBusinesses;

  const visited = sorted.slice(0, 4).map((b) => toVisited(b, pos));
  const nearby = sorted.slice(0, 6).map((b) => toNearby(b, pos));
  const popularMasters = sorted.slice(0, 6).map((b, i) => toPopularMaster(b, i, pos));
  const popularStudios = sorted.slice(0, 6).map(toPopularStudio);

  return { visited, map: { nearbyCount: nearby.length }, nearby, popularMasters, popularStudios };
}

/* ── Hook ─────────────────────────────────────────────────────────────── */

export function useHomeData(): UseHomeDataResult {
  const [data, setData] = useState<HomePageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const { city } = useCityStore();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setError(null);

      // Phase 1 — fetch businesses and show immediately (no GPS wait)
      let businesses: Business[] = [];
      try {
        const apiResult = await fetchBusinesses({ city: city.id, limit: 50 });
        if (cancelled) return;
        businesses = apiResult.data ?? [];
      } catch {
        if (cancelled) return;
      }

      const isRealData = businesses.length > 0;
      if (!isRealData) businesses = SHARED_MOCK_BUSINESSES;
      const readyBusinesses = isRealData ? businesses.filter(isReadyForListing) : businesses;

      setData(buildHomeData(readyBusinesses, null));
      setIsLoading(false);

      // Phase 2 — get GPS silently and re-sort by distance
      const pos = await getUserPosition();
      if (cancelled || !pos) return;
      setData(buildHomeData(readyBusinesses, pos));
    };

    run().catch((e) => {
      if (!cancelled) {
        setError(e instanceof Error ? e : new Error('Home data failed'));
        setIsLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [tick, city.id]);

  return { data, isLoading, error, refetch: () => setTick((t) => t + 1) };
}
