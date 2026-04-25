/**
 * NearbyPage — "Рядом" tab with Yandex Maps integration.
 *
 * Production-ready implementation:
 *  - Real geolocation with permission handling + fallback
 *  - Backend-driven data: businesses sorted by distance, with real lat/lng
 *  - Functional filters: category, price range, rating
 *  - Search with debounced input and live results
 *  - Map ↔ list synchronization (marker click → scroll card, card click → focus marker)
 *  - Route display on selected business
 *  - Custom price-bubble placemarks with category icons
 *  - Clustered markers when zoomed out
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useGeolocation } from '@/hooks/useGeolocation'
import { fetchNearbyBusinesses, fetchRoute } from '@/lib/api/businesses'
import type { NearbyBusinessResult, CategoryEnum, RouteResult } from '@/lib/api/types'
import type { NearbyBusinessCard } from '@/lib/api/home'
import { useThemeStore } from '@/stores/themeStore'
import { Skeleton } from '@/shared/ui'
import { getMockBusinessImage } from '@/lib/utils/mockImages'
import { NearbyCard } from '@/components/features/home/HomeCards'
import styles from './NearbyPage.module.css'

/* ── Yandex Maps global ─────────────────────────────────────────────────── */

declare global {
  interface Window {
    ymaps: any
  }
}

/* ── Constants ──────────────────────────────────────────────────────────── */

const DEBOUNCE_MS = 400
const DEFAULT_RADIUS_KM = 15
const DEFAULT_ZOOM = 14

const PRICE_RANGE_DATA = [
  { min: undefined, max: undefined },
  { min: undefined, max: 100000 },
  { min: 100000, max: 300000 },
  { min: 300000, max: undefined },
] as const


/* ── SVG Icons ──────────────────────────────────────────────────────────── */

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke="#6B7280" strokeWidth="2" />
    <path d="M21 21L16.5 16.5" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const ClearIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 4L12 12M12 4L4 12" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M3 7H21M6 12H18M10 17H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const ChevronIcon = () => (
  <svg width="9" height="6" viewBox="0 0 9 6" fill="none">
    <path d="M1 1L4.5 4.5L8 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const LocateIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    <path d="M12 2V5M12 19V22M2 12H5M19 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const WalkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 10L8 22M14 10L16 22M10 10H14M9 16H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CloseIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const NavigateIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M3 11L22 2L13 21L11 13L3 11Z" fill="currentColor" />
  </svg>
)

/* ── Formatting helpers ─────────────────────────────────────────────────── */

function formatPrice(price: number): string {
  if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M`
  if (price >= 1000) return `${Math.round(price / 1000)}k`
  return `${price}`
}

function formatDistance(km: number | null): string {
  if (km === null) return ''
  if (km < 1) return `${Math.round(km * 1000)} м`
  return `${km.toFixed(1)} км`
}

function formatDuration(min: number | null): string {
  if (min === null) return ''
  if (min < 60) return `${min} мин`
  return `${Math.floor(min / 60)} ч ${min % 60} мин`
}

function toNearbyCard(biz: NearbyBusinessResult): NearbyBusinessCard {
  return {
    id: biz.id,
    providerType: 'business',
    name: biz.name,
    category: biz.category as CategoryEnum,
    categoryLabel: '',
    distanceMeters: biz.distance_km !== null ? Math.round(biz.distance_km * 1000) : 0,
    priceFrom: biz.min_price || 0,
    rating: biz.rating || 0,
    photoUrl: (biz as any).photo_url || getMockBusinessImage(biz.category, biz.id),
    businessId: biz.id,
  }
}

/* ── Map theme ──────────────────────────────────────────────────────────── */

function applyMapTheme(map: any, theme: 'dark' | 'light') {
  const el = map.panes.get('ground')?.getElement()
  if (!el) return
  if (theme === 'dark') {
    el.style.filter = 'invert(1) hue-rotate(180deg) brightness(0.85) contrast(1.2) saturate(0.3)'
  } else {
    el.style.filter = 'none'
  }
}

/* ── Debounce hook ──────────────────────────────────────────────────────── */

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

/* ── Component ──────────────────────────────────────────────────────────── */

export default function NearbyPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { theme } = useThemeStore()

  const PRICE_RANGES = [
    { label: t('nearby.anyPrice'), min: undefined, max: undefined },
    { label: t('nearby.priceBelow100'), min: undefined, max: 100000 },
    { label: t('nearby.price100to300'), min: 100000, max: 300000 },
    { label: t('nearby.priceAbove300'), min: 300000, max: undefined },
  ] as const

  const CATEGORY_FILTERS: { key: CategoryEnum | 'all'; label: string }[] = [
    { key: 'all', label: t('common.all') },
    { key: 'hair', label: t('nearbyFilters.hair') },
    { key: 'barber', label: t('nearbyFilters.barber') },
    { key: 'nail', label: t('nearbyFilters.nail') },
    { key: 'brow_lash', label: t('nearbyFilters.brow_lash') },
    { key: 'spa_massage', label: t('nearbyFilters.spa_massage') },
    { key: 'makeup', label: t('nearbyFilters.makeup') },
    { key: 'cosmetology', label: t('nearbyFilters.cosmetology') },
  ]
  const { effectivePosition, position, permission, isLoading: geoLoading, requestPosition } = useGeolocation()

  // Map refs
  const mapRef = useRef<HTMLDivElement>(null)
  const ymapRef = useRef<any>(null)
  const placemarkCollectionRef = useRef<any>(null)
  const routeLineRef = useRef<any>(null)
  const userPlacemarkRef = useRef<any>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  // State
  const [mapReady, setMapReady] = useState(false)
  const [businesses, setBusinesses] = useState<NearbyBusinessResult[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [activeCardIndex, setActiveCardIndex] = useState(-1)
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<CategoryEnum | 'all'>('all')
  const [selectedPriceRange, setSelectedPriceRange] = useState(0) // index into PRICE_RANGES
  const [minRating, setMinRating] = useState<number | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)

  const debouncedSearch = useDebounce(searchQuery, DEBOUNCE_MS)

  /* ── Fetch businesses ──────────────────────────────────────────────────── */

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setDataLoading(true)
      try {
        const priceRange = PRICE_RANGE_DATA[selectedPriceRange]
        const res = await fetchNearbyBusinesses({
          lat: effectivePosition.lat,
          lng: effectivePosition.lng,
          radius: DEFAULT_RADIUS_KM,
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          search: debouncedSearch || undefined,
          priceMin: priceRange.min,
          priceMax: priceRange.max,
          minRating,
          sort: 'distance',
          limit: 50,
        })
        if (!cancelled) {
          setBusinesses(res.data ?? [])
          setActiveCardIndex(-1)
          setActiveRoute(null)
        }
      } catch {
        if (!cancelled) setBusinesses([])
      } finally {
        if (!cancelled) setDataLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [effectivePosition.lat, effectivePosition.lng, selectedCategory, selectedPriceRange, minRating, debouncedSearch])

  /* ── Init Yandex Map ──────────────────────────────────────────────────── */

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.ymaps) return

    window.ymaps.ready(() => {
      if (ymapRef.current) return

      const map = new window.ymaps.Map(mapRef.current, {
        center: [effectivePosition.lat, effectivePosition.lng],
        zoom: DEFAULT_ZOOM,
        controls: [],
      }, {
        suppressMapOpenBlock: true,
        yandexMapDisablePoiInteractivity: true,
      })

      applyMapTheme(map, theme)
      ymapRef.current = map
      setMapReady(true)
    })
  }, [effectivePosition.lat, effectivePosition.lng])

  useEffect(() => {
    if (window.ymaps) {
      initMap()
    } else {
      const checkInterval = setInterval(() => {
        if (window.ymaps) {
          clearInterval(checkInterval)
          initMap()
        }
      }, 100)
      return () => clearInterval(checkInterval)
    }

    return () => {
      if (ymapRef.current) {
        ymapRef.current.destroy()
        ymapRef.current = null
      }
    }
  }, [initMap])

  // Theme sync
  useEffect(() => {
    if (ymapRef.current) applyMapTheme(ymapRef.current, theme)
  }, [theme])

  /* ── Update placemarks when data changes ─────────────────────────────── */

  useEffect(() => {
    if (!mapReady || !ymapRef.current) return
    const map = ymapRef.current

    // Remove old placemarks
    if (placemarkCollectionRef.current) {
      map.geoObjects.remove(placemarkCollectionRef.current)
    }

    // Create clusterer for performance
    const clusterer = new window.ymaps.Clusterer({
      preset: 'islands#greenClusterIcons',
      groupByCoordinates: false,
      clusterDisableClickZoom: false,
      clusterHideIconOnBalloonOpen: false,
      geoObjectHideIconOnBalloonOpen: false,
    })

    const placemarks = businesses.map((biz, index) => {
      if (biz.lat === null || biz.lng === null) return null

      const isActive = index === activeCardIndex
      const priceLabel = formatPrice(biz.min_price || 0)

      const layout = window.ymaps.templateLayoutFactory.createClass(
        `<div class="${styles.priceBubble} ${isActive ? styles.priceBubbleActive : ''}" data-biz-index="${index}">
          <span class="${styles.priceBubbleText}">${priceLabel}</span>
        </div>`
      )

      const placemark = new window.ymaps.Placemark(
        [biz.lat, biz.lng],
        { bizIndex: index, bizName: biz.name },
        {
          iconLayout: layout,
          iconShape: { type: 'Rectangle', coordinates: [[-35, -15], [35, 15]] },
        }
      )

      placemark.events.add('click', () => {
        setActiveCardIndex(index)
        scrollCarouselTo(index)
        // Load route when marker clicked
        loadRoute(biz)
      })

      return placemark
    }).filter(Boolean)

    clusterer.add(placemarks)
    map.geoObjects.add(clusterer)
    placemarkCollectionRef.current = clusterer

    // Update user location marker
    if (userPlacemarkRef.current) {
      map.geoObjects.remove(userPlacemarkRef.current)
    }

    const userDotLayout = window.ymaps.templateLayoutFactory.createClass(
      `<div style="position:relative;width:16px;height:16px;">
        <div style="position:absolute;width:40px;height:40px;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(154,210,64,0.2);border-radius:50%;pointer-events:none;animation:pulse 2s infinite;"></div>
        <div style="width:16px;height:16px;background:#6BCEFF;border:2px solid #18191B;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);position:relative;z-index:1;"></div>
      </div>`
    )

    const userPm = new window.ymaps.Placemark(
      [effectivePosition.lat, effectivePosition.lng],
      {},
      {
        iconLayout: userDotLayout,
        iconShape: { type: 'Circle', coordinates: [8, 8], radius: 20 },
      }
    )
    map.geoObjects.add(userPm)
    userPlacemarkRef.current = userPm
  }, [mapReady, businesses, activeCardIndex, effectivePosition])

  /* ── Route display ───────────────────────────────────────────────────── */

  const loadRoute = useCallback(async (biz: NearbyBusinessResult) => {
    if (!biz.lat || !biz.lng || !position) return

    setRouteLoading(true)
    try {
      const route = await fetchRoute(
        { lat: position.lat, lng: position.lng },
        { lat: biz.lat, lng: biz.lng },
        'walking'
      )
      setActiveRoute(route)

      // Draw polyline on map
      if (ymapRef.current && route.polyline && route.polyline.length > 1) {
        if (routeLineRef.current) {
          ymapRef.current.geoObjects.remove(routeLineRef.current)
        }
        const polyline = new window.ymaps.Polyline(
          route.polyline,
          {},
          {
            strokeColor: '#6BCEFF',
            strokeWidth: 4,
            strokeOpacity: 0.8,
          }
        )
        ymapRef.current.geoObjects.add(polyline)
        routeLineRef.current = polyline
      }
    } catch {
      // Silently fail — route is optional UX enhancement
    } finally {
      setRouteLoading(false)
    }
  }, [position])

  // Clear route when deselecting
  useEffect(() => {
    if (activeCardIndex === -1 && routeLineRef.current && ymapRef.current) {
      ymapRef.current.geoObjects.remove(routeLineRef.current)
      routeLineRef.current = null
      setActiveRoute(null)
    }
  }, [activeCardIndex])

  /* ── Carousel scroll sync ────────────────────────────────────────────── */

  const scrollCarouselTo = (index: number) => {
    const carousel = carouselRef.current
    if (!carousel) return
    const cards = carousel.children
    if (cards[index]) {
      ;(cards[index] as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start',
      })
    }
  }

  const handleCardClick = (biz: NearbyBusinessResult, index: number) => {
    if (activeCardIndex === index) {
      // Second click → navigate to detail
      navigate(`/business/${biz.id}`)
    } else {
      setActiveCardIndex(index)
      // Pan map to business
      if (ymapRef.current && biz.lat && biz.lng) {
        ymapRef.current.panTo([biz.lat, biz.lng], { duration: 300 })
      }
      loadRoute(biz)
    }
  }

  const handleLocateMe = () => {
    if (position && ymapRef.current) {
      ymapRef.current.setCenter([position.lat, position.lng], DEFAULT_ZOOM, { duration: 300 })
    } else {
      requestPosition()
    }
  }

  const handleOpenNavigator = (biz: NearbyBusinessResult) => {
    if (!biz.lat || !biz.lng) return
    // Open in Yandex Navigator / Yandex Maps app
    const url = `https://yandex.ru/maps/?rtext=${effectivePosition.lat},${effectivePosition.lng}~${biz.lat},${biz.lng}&rtt=pd`
    window.open(url, '_blank')
  }

  /* ── Filter counts ───────────────────────────────────────────────────── */

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (selectedCategory !== 'all') count++
    if (selectedPriceRange !== 0) count++
    if (minRating) count++
    return count
  }, [selectedCategory, selectedPriceRange, minRating])

  /* ── Render ──────────────────────────────────────────────────────────── */

  const selectedBiz = activeCardIndex >= 0 ? businesses[activeCardIndex] : null

  return (
    <div className={styles.page}>
      {/* Yandex Map */}
      <div ref={mapRef} className={styles.mapContainer} />

      {/* Header: Search + Filters */}
      <div className={styles.header}>
        <div className={styles.searchRow}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}><SearchIcon /></span>
            <input
              className={styles.searchInput}
              type="text"
              placeholder={t('nearby.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className={styles.clearBtn} onClick={() => setSearchQuery('')}>
                <ClearIcon />
              </button>
            )}
          </div>
        </div>

        {/* Category filter row */}
        <div className={styles.filtersRow}>
          <button
            className={`${styles.filterPill} ${activeFilterCount > 0 ? styles.filterPillActive : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <span className={styles.filterIcon}><FilterIcon /></span>
            <span className={styles.filterPillLabel}>
              {t('nearby.filters')}{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </span>
          </button>
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat.key}
              className={`${styles.filterPill} ${selectedCategory === cat.key ? styles.filterPillActive : ''}`}
              onClick={() => setSelectedCategory(cat.key)}
            >
              <span className={styles.filterPillLabel}>{cat.label}</span>
              {selectedCategory === cat.key && cat.key !== 'all' && (
                <span className={styles.filterCloseIcon} onClick={(e) => { e.stopPropagation(); setSelectedCategory('all') }}>
                  <CloseIcon />
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Expanded filter panel */}
        {showFilters && (
          <div className={styles.filterPanel}>
            <div className={styles.filterSection}>
              <span className={styles.filterSectionTitle}>{t('nearby.price')}</span>
              <div className={styles.filterOptions}>
                {PRICE_RANGES.map((range, i) => (
                  <button
                    key={i}
                    className={`${styles.filterOption} ${selectedPriceRange === i ? styles.filterOptionActive : ''}`}
                    onClick={() => setSelectedPriceRange(i)}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filterSection}>
              <span className={styles.filterSectionTitle}>{t('nearby.rating')}</span>
              <div className={styles.filterOptions}>
                {[undefined, 4.0, 4.5, 4.8].map((r, i) => (
                  <button
                    key={i}
                    className={`${styles.filterOption} ${minRating === r ? styles.filterOptionActive : ''}`}
                    onClick={() => setMinRating(r)}
                  >
                    {r ? `${r}+` : t('nearby.anyRating')}
                  </button>
                ))}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                className={styles.clearFiltersBtn}
                onClick={() => {
                  setSelectedCategory('all')
                  setSelectedPriceRange(0)
                  setMinRating(undefined)
                  setShowFilters(false)
                }}
              >
                {t('nearby.clearFilters')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Locate me button */}
      <button
        className={styles.locateBtn}
        onClick={handleLocateMe}
        aria-label="Моё местоположение"
      >
        <LocateIcon />
      </button>

      {/* Route info badge */}
      {selectedBiz && activeRoute && (
        <div className={styles.routeBadge}>
          <WalkIcon />
          <span>{formatDistance(activeRoute.distance_km)}</span>
          <span className={styles.routeBadgeSep}>•</span>
          <span>{formatDuration(activeRoute.duration_min)}</span>
          <button
            className={styles.routeNavBtn}
            onClick={() => handleOpenNavigator(selectedBiz)}
            aria-label="Открыть в навигаторе"
          >
            <NavigateIcon />
          </button>
        </div>
      )}

      {/* Geolocation permission banner */}
      {permission === 'denied' && (
        <div className={styles.geoBanner}>
          <span>{t('nearby.geoDisabled')}</span>
        </div>
      )}

      {/* Loading indicator */}
      {(dataLoading || geoLoading) && (
        <div className={styles.loadingIndicator}>
          <div className={styles.loadingDot} />
          <span>{geoLoading ? t('nearby.loadingGeo') : t('nearby.loadingData')}</span>
        </div>
      )}

      {/* Skeleton cards while loading */}
      {dataLoading && (
        <div className={styles.carouselLayer}>
          <div className={styles.carousel}>
            {[1, 2, 3].map(i => (
              <div key={i} className={styles.skeletonCard}>
                <Skeleton variant="rect" width={64} height={64} />
                <div className={styles.skeletonBody}>
                  <Skeleton variant="rect" height={14} />
                  <Skeleton variant="rect" height={12} width="60%" />
                  <Skeleton variant="rect" height={12} width="40%" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results count */}
      {!dataLoading && businesses.length > 0 && (
        <div className={styles.resultsCount}>
          {t('nearby.salons', { count: businesses.length })}
        </div>
      )}

      {/* Bottom Card Carousel */}
      <div className={styles.carouselLayer}>
        <div className={styles.carousel} ref={carouselRef}>
          {businesses.map((biz, index) => {
            const isActive = index === activeCardIndex
            return (
              <div
                key={biz.id}
                className={`${styles.nearbyCardWrap} ${isActive ? styles.nearbyCardWrapActive : ''}`}
                onClick={() => handleCardClick(biz, index)}
                onKeyDown={(e) => e.key === 'Enter' && handleCardClick(biz, index)}
              >
                <NearbyCard item={toNearbyCard(biz)} compact />
              </div>
            )
          })}

          {!dataLoading && businesses.length === 0 && (
            <div className={styles.emptyCard}>
              <span className={styles.emptyCardText}>
                {searchQuery || activeFilterCount > 0
                  ? t('nearby.noResults')
                  : t('nearby.noNearby')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
