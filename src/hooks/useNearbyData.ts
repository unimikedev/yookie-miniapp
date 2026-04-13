/**
 * useNearbyData — data hook for the NearbyPage (Map View).
 *
 * Fetches businesses and projects them into the shape the map UI needs,
 * including lat/lng coordinates for placemarks. Falls back to mock data
 * with deterministic Tashkent coordinates when the API has no geo data.
 */

import { useEffect, useState } from 'react'
import { fetchBusinesses } from '../lib/api/businesses'
import { CATEGORY_LABELS } from '../lib/api/types'
import type { Business, CategoryEnum } from '../lib/api/types'
import { getMockBusinessImage } from '../lib/utils/mockImages'
import { MOCK_BUSINESSES as SHARED_MOCK_BUSINESSES } from '../lib/mockBusinesses'

export interface NearbyBusiness {
  id: string
  name: string
  category: CategoryEnum
  categoryLabel: string
  distanceMeters: number
  priceFrom: number
  rating: number
  photoUrl: string | null
  lat: number
  lng: number
  businessId: string
}

interface UseNearbyDataResult {
  businesses: NearbyBusiness[]
  isLoading: boolean
  error: Error | null
}

/* ── Deterministic helpers ─────────────────────────────────────────────── */

function hashInt(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h
}

function seedDistance(seed: string): number {
  return 200 + (hashInt(seed) % 180) * 10
}

function seedPrice(seed: string): number {
  return 150_000 + (hashInt(seed + 'price') % 10) * 50_000
}

function seedRating(seed: string): number {
  return +(4.3 + (hashInt(seed + 'r') % 8) * 0.1).toFixed(1)
}

/* ── Mock coordinates around Tashkent center ─────────────────────────── */

const TASHKENT_CENTER: [number, number] = [41.311081, 69.240562]

const MOCK_COORDS: [number, number][] = [
  [41.3192, 69.2350], // NW — near Amir Temur
  [41.3141, 69.2509], // NE — near Yunus Rajabiy
  [41.3060, 69.2430], // S — near Kosmonavtlar
  [41.3098, 69.2280], // W — near Mustaqillik
  [41.3225, 69.2600], // Far NE
  [41.3020, 69.2550], // SE — near Mingbuloq
]

/* ── Projection ──────────────────────────────────────────────────────── */

function toNearbyBusiness(b: Business, index: number): NearbyBusiness {
  const coords = MOCK_COORDS[index % MOCK_COORDS.length]
  return {
    id: `nearby-${b.id}`,
    name: b.name,
    category: b.category,
    categoryLabel: CATEGORY_LABELS[b.category],
    distanceMeters: seedDistance(b.id + 'n'),
    priceFrom: seedPrice(b.id + 'n'),
    rating: b.rating ?? seedRating(b.id),
    photoUrl: getMockBusinessImage(b.category, b.id),
    lat: b.lat ?? coords[0],
    lng: b.lng ?? coords[1],
    businessId: b.id,
  }
}

/* ── Hook ─────────────────────────────────────────────────────────────── */

export function useNearbyData(): UseNearbyDataResult {
  const [businesses, setBusinesses] = useState<NearbyBusiness[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setIsLoading(true)
      setError(null)

      let raw: Business[] = []
      try {
        const res = await fetchBusinesses({ limit: 6 })
        raw = res.data ?? []
      } catch {
        /* fall through to mock */
      }

      if (raw.length === 0) raw = SHARED_MOCK_BUSINESSES.slice(0, 6)

      if (cancelled) return

      setBusinesses(raw.map((b, i) => toNearbyBusiness(b, i)))
      setIsLoading(false)
    }

    run().catch((e) => {
      if (!cancelled) {
        setError(e instanceof Error ? e : new Error('Nearby data failed'))
        setIsLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  return { businesses, isLoading, error }
}
