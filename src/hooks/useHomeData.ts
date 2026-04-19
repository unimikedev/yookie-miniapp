/**
 * useHomeData — single source of truth for HomePage sections.
 *
 * Backend is the source of truth for all business data; however the
 * marketing home sections (visited / nearby / popular) don't yet have
 * dedicated endpoints. This hook fetches the generic businesses list
 * once and projects it into the shapes the UI requires. If the API
 * call fails or returns empty, we fall back to deterministic mock
 * data so the home screen always renders in demo/dev mode.
 */

import { useEffect, useState } from 'react';
import { fetchBusinesses } from '../lib/api/businesses';
import { CATEGORY_LABELS } from '../lib/api/types';
import type { Business } from '../lib/api/types';
import { useCityStore } from '../stores/cityStore';
// Single source of truth for mock businesses. Must match mockBusinesses.ts
// so that navigating from a home card to /business/:id hits an id that
// the detail-page fallback (getMockBusiness) can resolve.
import {
  MOCK_BUSINESSES as SHARED_MOCK_BUSINESSES,
  MOCK_MASTERS as SHARED_MOCK_MASTERS,
} from '../lib/mockBusinesses';

/**
 * Pick a real mock master id for the given business so that navigating
 * from a home card to /business/:id/master/:masterId resolves against
 * the shared mock dataset used by MasterDetailPage.
 */
function pickMasterId(businessId: string, idx = 0): string {
  const candidates = SHARED_MOCK_MASTERS.filter((m) => m.business_id === businessId);
  if (candidates.length === 0) return `${businessId}-master-${idx}`;
  return candidates[idx % candidates.length].id;
}
import type {
  HomePageData,
  VisitedMasterCard,
  NearbyBusinessCard,
  PopularMasterCard,
  PopularStudioCard,
} from '../lib/api/home';
import { getMockBusinessImage, getMockMasterImage } from '../lib/utils/mockImages';

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
}

interface UseHomeDataResult {
  data: HomePageData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/* ── Deterministic helpers ─────────────────────────────────────────────── */

function hashInt(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

function seedDistance(seed: string): number {
  // 200m — 2000m
  return 200 + (hashInt(seed) % 180) * 10;
}

function seedPrice(seed: string): number {
  // 150 000 — 600 000 sum, rounded to 50k
  const h = hashInt(seed + 'price');
  return 150_000 + (h % 10) * 50_000;
}

function seedRating(seed: string): number {
  // 4.3 — 5.0
  return +(4.3 + (hashInt(seed + 'r') % 8) * 0.1).toFixed(1);
}

/* ── Projection from Business → card shapes ───────────────────────────── */

function toVisited(b: Business): VisitedMasterCard {
  const h = hashInt(b.id + 'lv');
  const daysAgo = (h % 14) + 1;
  const lastVisit = new Date();
  lastVisit.setDate(lastVisit.getDate() - daysAgo);
  const formattedDate = lastVisit.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Use real master from API if available
  const apiMasters = (b as ApiBusiness).masters ?? [];
  const activeMasters = apiMasters.filter((m: ApiMaster) => m.is_active);
  const master = activeMasters[0] ?? null;

  return {
    id: `visited-${b.id}`,
    providerType: b.provider_type,
    masterName: master?.name ?? firstMasterName(b),
    businessName: b.name,
    specialization: master?.specialization ?? CATEGORY_LABELS[b.category] ?? '',
    distanceMeters: seedDistance(b.id),
    priceFrom: seedPrice(b.id),
    rating: master?.rating ?? b.rating ?? seedRating(b.id),
    photoUrl: master?.photo_url ?? getMockMasterImage(b.id),
    hasSlotsToday: (hashInt(b.id) & 1) === 0,
    businessId: b.id,
    masterId: master?.id ?? pickMasterId(b.id, 0),
    lastVisitDate: formattedDate,
  };
}

function toNearby(b: Business): NearbyBusinessCard {
  return {
    id: `nearby-${b.id}`,
    providerType: b.provider_type,
    name: b.name,
    category: b.category,
    categoryLabel: CATEGORY_LABELS[b.category],
    distanceMeters: seedDistance(b.id + 'n'),
    priceFrom: seedPrice(b.id + 'n'),
    rating: b.rating ?? seedRating(b.id),
    photoUrl: b.photo_url ?? getMockBusinessImage(b.category, b.id),
    businessId: b.id,
  };
}

function toPopularMaster(b: Business, idx: number): PopularMasterCard {
  const seed = b.id + '-pm-' + idx;

  // Use real master from API if available
  const apiMasters = (b as ApiBusiness).masters ?? [];
  const activeMasters = apiMasters.filter((m: ApiMaster) => m.is_active);
  const master = activeMasters[idx % Math.max(1, activeMasters.length)] ?? null;

  return {
    id: `pm-${b.id}-${idx}`,
    providerType: b.provider_type,
    name: master?.name ?? nthMasterName(idx),
    specialization: master?.specialization ?? masterSpecialization(b.category),
    distanceMeters: seedDistance(seed),
    priceFrom: seedPrice(seed),
    rating: master?.rating ?? seedRating(seed),
    photoUrl: master?.photo_url ?? getMockMasterImage(seed),
    businessId: b.id,
    masterId: master?.id ?? pickMasterId(b.id, idx),
  };
}

function toPopularStudio(b: Business): PopularStudioCard {
  const photoUrl = b.photo_url ?? getMockBusinessImage(b.category, b.id);
  const photos = [photoUrl, photoUrl, photoUrl].filter((p): p is string => Boolean(p));
  return {
    id: `ps-${b.id}`,
    providerType: b.provider_type,
    name: b.name,
    category: b.category,
    categoryLabel: CATEGORY_LABELS[b.category],
    rating: b.rating ?? seedRating(b.id),
    reviewCount: 80 + (hashInt(b.id + 'rc') % 200),
    photoUrl,
    photos,
    businessId: b.id,
  };
}

/* ── Name pools (deterministic, avoid Math.random) ────────────────────── */

const MASTER_NAMES = [
  'Александр В.',
  'Гульноза',
  'Самира',
  'Дильшод',
  'Азиза',
  'Рустам',
  'Нигора',
  'Тимур',
];

function firstMasterName(b: Business) {
  return MASTER_NAMES[hashInt(b.id) % MASTER_NAMES.length];
}

function nthMasterName(idx: number) {
  return MASTER_NAMES[(idx * 3 + 1) % MASTER_NAMES.length];
}

function masterSpecialization(cat: string): string {
  const map: Record<string, string> = {
    hair: 'Стилист',
    barber: 'Барбер',
    nail: 'Мастер маникюра',
    brow_lash: 'Бровист',
    makeup: 'Визажист',
    spa_massage: 'Массажист',
    epilation: 'Мастер эпиляции',
    cosmetology: 'Косметолог',
    tattoo: 'Тату-мастер',
    piercing: 'Мастер пирсинга',
    yoga: 'Тренер йоги',
    fitness: 'Фитнес-тренер',
  };
  return map[cat] ?? 'Мастер';
}

/* ── Mock fallback ────────────────────────────────────────────────────── */

// Re-exported from lib/mockBusinesses so home cards and detail pages share
// the same business identifiers.
const MOCK_BUSINESSES: Business[] = SHARED_MOCK_BUSINESSES;

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

      let businesses: Business[] = [];
      try {
        const res = await fetchBusinesses({ city: city.id, limit: 50 });
        businesses = res.data ?? [];
      } catch {
        /* fall through to mock */
      }

      const isRealData = businesses.length > 0;
      if (!isRealData) businesses = MOCK_BUSINESSES;

      if (cancelled) return;

      // For real API data, hide only explicitly deactivated businesses.
      // Masters are not embedded in the list response, so we can't check them here.
      const readyBusinesses = isRealData
        ? businesses.filter((b) => b.is_active !== false)
        : businesses;

      const visited = readyBusinesses.slice(0, 4).map(toVisited);
      const nearby = readyBusinesses.slice(0, 6).map(toNearby);
      const popularMasters = readyBusinesses
        .slice(0, 6)
        .map((b, i) => toPopularMaster(b as unknown as ApiBusiness, i));
      const popularStudios = readyBusinesses.slice(0, 6).map(toPopularStudio);

      setData({
        visited,
        map: { nearbyCount: nearby.length },
        nearby,
        popularMasters,
        popularStudios,
      });
      setIsLoading(false);
    };

    run().catch((e) => {
      if (!cancelled) {
        setError(e instanceof Error ? e : new Error('Home data failed'));
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  return { data, isLoading, error, refetch: () => setTick((t) => t + 1) };
}
