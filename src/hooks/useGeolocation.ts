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

// Module-level cache shared across all useGeolocation instances.
// Prevents re-firing the Telegram native location dialog on every remount.
let _geoCache: GeoPosition | null = null
let _geoCacheTs = 0
const GEO_CACHE_TTL = 10 * 60 * 1000 // 10 minutes

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

    // Return cached position if fresh enough — avoids re-firing Telegram's confirm dialog
    if (_geoCache && Date.now() - _geoCacheTs < GEO_CACHE_TTL) {
      setPosition(_geoCache)
      setPermission('granted')
      return
    }

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
        setPosition(geo)
        setPermission('granted')
        setIsLoading(false)
        setError(null)
      },
      (err) => {
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

  // Auto-request on mount
  useEffect(() => {
    if (autoRequest && !requestedRef.current && permission !== 'denied' && permission !== 'unavailable') {
      requestedRef.current = true
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
