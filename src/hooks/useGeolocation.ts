/**
 * useGeolocation — Browser Geolocation API hook with permission handling.
 *
 * Features:
 *  - Requests user's position once on mount (or on demand)
 *  - Handles permission states: prompt, granted, denied
 *  - Provides fallback coordinates (Tashkent city center)
 *  - Works in Telegram Mini App context
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useCityStore } from '../stores/cityStore'

export interface GeoPosition {
  lat: number
  lng: number
  accuracy?: number
}

export type GeoPermission = 'prompt' | 'granted' | 'denied' | 'unavailable'

interface UseGeolocationResult {
  position: GeoPosition | null
  /** Effective position: user's real position or fallback */
  effectivePosition: GeoPosition
  permission: GeoPermission
  isLoading: boolean
  error: string | null
  /** Manually request geolocation */
  requestPosition: () => void
}

// Tashkent city center fallback
const TASHKENT_CENTER: GeoPosition = { lat: 41.311081, lng: 69.240562 }

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 300000, // Cache for 5 minutes
}

// Module-level cache — shared within a single JS session (fast path).
let _geoCache: GeoPosition | null = null
let _geoCacheTs = 0
const GEO_CACHE_TTL = 10 * 60 * 1000 // 10 minutes

// localStorage persistence — survives Telegram WebView re-initializations.
const GEO_LS_KEY = 'yookie_geo_cache'

function readGeoCache(): GeoPosition | null {
  try {
    const raw = localStorage.getItem(GEO_LS_KEY)
    if (!raw) return null
    const { lat, lng, accuracy, ts } = JSON.parse(raw) as GeoPosition & { ts: number }
    if (Date.now() - ts > GEO_CACHE_TTL) return null
    return { lat, lng, accuracy }
  } catch { return null }
}

function writeGeoCache(pos: GeoPosition) {
  try {
    localStorage.setItem(GEO_LS_KEY, JSON.stringify({ ...pos, ts: Date.now() }))
  } catch { /* noop */ }
}

export function useGeolocation(autoRequest = true): UseGeolocationResult {
  const [position, setPosition] = useState<GeoPosition | null>(null)
  const [permission, setPermission] = useState<GeoPermission>('prompt')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestedRef = useRef(false)

  // Check permission status via Permissions API (if available)
  useEffect(() => {
    if (!navigator.geolocation) {
      setPermission('unavailable')
      return
    }

    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((status) => {
        setPermission(status.state as GeoPermission)
        status.addEventListener('change', () => {
          setPermission(status.state as GeoPermission)
        })
      }).catch(() => {
        // Permissions API not supported — try requesting directly
      })
    }
  }, [])

  const requestPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setPermission('unavailable')
      setError('Геолокация не поддерживается')
      return
    }

    // 1. Module-level cache — same JS session, zero cost
    if (_geoCache && Date.now() - _geoCacheTs < GEO_CACHE_TTL) {
      useCityStore.getState().setFromGeolocation(_geoCache.lat, _geoCache.lng)
      setPosition(_geoCache)
      setPermission('granted')
      return
    }

    // 2. localStorage cache — survives WebView re-init (Telegram minimize/reopen)
    const lsCache = readGeoCache()
    if (lsCache) {
      _geoCache = lsCache
      _geoCacheTs = Date.now()
      useCityStore.getState().setFromGeolocation(lsCache.lat, lsCache.lng)
      setPosition(lsCache)
      setPermission('granted')
      return
    }

    // 3. Native request — guard against duplicate calls within same mount
    if (requestedRef.current) return
    requestedRef.current = true

    setIsLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const geo: GeoPosition = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }
        _geoCache = geo
        _geoCacheTs = Date.now()
        writeGeoCache(geo)
        useCityStore.getState().setFromGeolocation(geo.lat, geo.lng)
        setPosition(geo)
        setPermission('granted')
        setIsLoading(false)
        setError(null)
      },
      (err) => {
        requestedRef.current = false  // allow retry on error
        setIsLoading(false)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setPermission('denied')
            setError('Доступ к геолокации запрещён')
            break
          case err.POSITION_UNAVAILABLE:
            setError('Не удалось определить местоположение')
            break
          case err.TIMEOUT:
            setError('Время ожидания геолокации истекло')
            break
          default:
            setError('Ошибка геолокации')
        }
      },
      GEO_OPTIONS
    )
  }, [])

  // Auto-request on mount and when permission changes (e.g. user grants via system settings)
  useEffect(() => {
    if (autoRequest && permission !== 'denied' && permission !== 'unavailable') {
      requestPosition()
    }
  }, [autoRequest, permission, requestPosition])

  const effectivePosition = position ?? TASHKENT_CENTER

  return {
    position,
    effectivePosition,
    permission,
    isLoading,
    error,
    requestPosition,
  }
}
