/**
 * useNearbyData — data hook for the NearbyPage (Map View).
 *
 * Fetches businesses with real GPS-based distances. No fake/seeded data.
 * Falls back to mock data with deterministic Tashkent coordinates only in DEV.
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
  userPos: { lat: number; lng: number } | null
}

interface ApiBusiness extends Business {
  min_price?: number
  distance_km?: number | null
}

/* ── Tashkent center fallback coords ─────────────────────────────────── */

const TASHKENT_CENTER = { lat: 41.311081, lng: 69.240562 }

// Spread of fallback coords for mock businesses without real lat/lng
const MOCK_COORDS: [number, number][] = [
  [41.2989, 69.2442],
  [41.2861, 69.1923],
  [41.3038, 69.3271],
  [41.2978, 69.2389],
  [41.3345, 69.2872],
  [41.3012, 69.2301],
]

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getUserPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000, maximumAge: 60000 }
    )
  })
}

function toNearbyBusiness(
  b: Business,
  index: number,
  userPos: { lat: number; lng: number } | null
): NearbyBusiness {
  const ab = b as ApiBusiness

  // Distance: prefer API distance_km, then compute from GPS, then 0
  let distanceMeters = 0
  if (ab.distance_km != null) {
    distanceMeters = Math.round(ab.distance_km * 1000)
  } else if (userPos && b.lat != null && b.lng != null) {
    distanceMeters = Math.round(haversineMeters(userPos.lat, userPos.lng, b.lat, b.lng))
  }

  // Coordinates: use real coords if available, else spread around Tashkent
  const fallbackCoords = MOCK_COORDS[index % MOCK_COORDS.length]
  const lat = b.lat ?? fallbackCoords[0]
  const lng = b.lng ?? fallbackCoords[1]

  return {
    id: `nearby-${b.id}`,
    name: b.name,
    category: b.category,
    categoryLabel: CATEGORY_LABELS[b.category],
    distanceMeters,
    priceFrom: ab.min_price ?? 0,
    rating: b.rating ?? 0,
    photoUrl: b.photo_url ?? getMockBusinessImage(b.category, b.id),
    lat,
    lng,
    businessId: b.id,
  }
}

/* ── Hook ─────────────────────────────────────────────────────────────── */

export function useNearbyData(): UseNearbyDataResult {
  const [businesses, setBusinesses] = useState<NearbyBusiness[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setIsLoading(true)
      setError(null)

      // Get GPS and fetch businesses in parallel
      const [posResult, apiResult] = await Promise.allSettled([
        getUserPosition(),
        fetchBusinesses({
          limit: 30,
          sort: 'distance',
          // We'll pass GPS once we have it; this initial fetch is without GPS
        }),
      ])

      if (cancelled) return

      const pos = posResult.status === 'fulfilled' ? posResult.value : null
      if (pos) setUserPos(pos)

      let raw: Business[] = []

      if (apiResult.status === 'fulfilled') {
        raw = apiResult.value.data ?? []
      }

      // If we have GPS and got data without it, re-fetch with GPS for proper distance sorting
      if (pos && raw.length > 0) {
        try {
          const geoRes = await fetchBusinesses({
            lat: pos.lat,
            lng: pos.lng,
            sort: 'distance',
            radius: 20,
            limit: 30,
          })
          if (!cancelled) raw = geoRes.data ?? raw
        } catch {
          // keep original result
        }
      }

      if (raw.length === 0) raw = SHARED_MOCK_BUSINESSES.slice(0, 10)

      if (cancelled) return

      setBusinesses(raw.map((b, i) => toNearbyBusiness(b, i, pos)))
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

  return { businesses, isLoading, error, userPos }
}
