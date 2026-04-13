/**
 * NearbyPage — "Рядом" tab with Yandex Maps integration.
 * Figma reference: node 113:3599 (Map View).
 *
 * Renders an interactive Yandex Map with:
 *  - Custom price-bubble placemarks for each business
 *  - User geolocation dot
 *  - Floating search bar + filter chips
 *  - Horizontally scrollable business cards carousel at bottom
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNearbyData, type NearbyBusiness } from '@/hooks/useNearbyData'
import { CATEGORY_LABELS } from '@/lib/api/types'
import { useThemeStore } from '@/stores/themeStore'
import { useCityStore } from '@/stores/cityStore'
import styles from './NearbyPage.module.css'

/* ── Yandex Maps global type declaration ─────────────────────────────────── */

declare global {
  interface Window {
    ymaps: any
  }
}

/* ── SVG Icons ───────────────────────────────────────────────────────────── */

const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke="#6B7280" strokeWidth="2" />
    <path d="M21 21L16.5 16.5" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const FilterLinesIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path
      d="M3 7H21M6 12H18M10 17H14"
      stroke="#F9FAFB"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

const ChevronDownIcon = () => (
  <svg width="9" height="6" viewBox="0 0 9 6" fill="none">
    <path d="M1 1L4.5 4.5L8 1" stroke="#F9FAFB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CloseSmallIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M1 1L9 9M9 1L1 9" stroke="#18191B" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path
      d="M6 0.5L7.76 4.06L11.7 4.64L8.85 7.42L9.53 11.34L6 9.5L2.47 11.34L3.15 7.42L0.3 4.64L4.24 4.06L6 0.5Z"
      fill="#FBBF24"
    />
  </svg>
)

const TagIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M1.33 8.53L7.47 2.39C7.72 2.14 8.06 2 8.41 2H13.33C13.7 2 14 2.3 14 2.67V7.59C14 7.94 13.86 8.28 13.61 8.53L7.47 14.67C6.95 15.19 6.11 15.19 5.59 14.67L1.33 10.41C0.81 9.89 0.81 9.05 1.33 8.53Z"
      stroke="#9CA3AF"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="11" cy="5" r="0.8" fill="#9CA3AF" />
  </svg>
)

/* Category icons for price bubbles */
const ScissorsIcon = ({ color = '#F9FAFB' }: { color?: string }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <circle cx="3" cy="3" r="2" stroke={color} strokeWidth="1" />
    <circle cx="3" cy="9" r="2" stroke={color} strokeWidth="1" />
    <path d="M11 1L5 6M11 11L5 6" stroke={color} strokeWidth="1" strokeLinecap="round" />
  </svg>
)

const CombIcon = ({ color = '#F9FAFB' }: { color?: string }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 1V11M2 3H6M2 5H5M2 7H6M2 9H5" stroke={color} strokeWidth="1" strokeLinecap="round" />
  </svg>
)

const SpaIcon = ({ color = '#F9FAFB' }: { color?: string }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 1C6 1 2 4 2 7C2 9.21 3.79 11 6 11C8.21 11 10 9.21 10 7C10 4 6 1 6 1Z" stroke={color} strokeWidth="1" strokeLinecap="round" />
  </svg>
)

const CATEGORY_ICONS: Record<string, (props: { color?: string }) => JSX.Element> = {
  hair: ScissorsIcon,
  barber: ScissorsIcon,
  nail: CombIcon,
  spa_massage: SpaIcon,
  brow_lash: CombIcon,
  makeup: CombIcon,
  epilation: CombIcon,
  cosmetology: SpaIcon,
  tattoo: CombIcon,
  piercing: CombIcon,
}

/* ── Format price ────────────────────────────────────────────────────────── */

function formatPrice(price: number): string {
  if (price >= 1000) {
    return `${Math.round(price / 1000)}k`
  }
  return `${price}`
}

function formatPriceFrom(price: number): string {
  if (price >= 1000) {
    return `от ${Math.round(price / 1000)} тыс.`
  }
  return `от ${price}`
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} км`
  }
  return `${meters} м`
}

/* ── Map theme toggle ──────────────────────────────────────────────────── */

function applyMapTheme(map: any, theme: 'dark' | 'light') {
  const el = map.panes.get('ground')?.getElement()
  if (!el) return
  if (theme === 'dark') {
    el.style.filter = 'invert(1) hue-rotate(180deg) brightness(0.85) contrast(1.2) saturate(0.3)'
  } else {
    el.style.filter = 'none'
  }
}

/* ── Component ───────────────────────────────────────────────────────────── */

export default function NearbyPage() {
  const navigate = useNavigate()
  const mapRef = useRef<HTMLDivElement>(null)
  const ymapRef = useRef<any>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [mapReady, setMapReady] = useState(false)
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [activeFilter, setActiveFilter] = useState<string | null>('hair')
  const { businesses, isLoading } = useNearbyData()
  const { theme } = useThemeStore()
  const { city } = useCityStore()

  /* ── Init Yandex Map ──────────────────────────────────────────────────── */

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.ymaps) return

    window.ymaps.ready(() => {
      if (ymapRef.current) return

      const map = new window.ymaps.Map(mapRef.current, {
        center: [city.lat, city.lng],
        zoom: 14,
        controls: [],
      }, {
        suppressMapOpenBlock: true,
        yandexMapDisablePoiInteractivity: true,
      })

      // Apply dark theme filter
      applyMapTheme(map, theme)

      ymapRef.current = map
      setMapReady(true)
    })
  }, [])

  useEffect(() => {
    // Check if ymaps is already loaded
    if (window.ymaps) {
      initMap()
    } else {
      // Wait for script to load
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

  /* ── Reactively update map theme ─────────────────────────────────────── */

  useEffect(() => {
    if (ymapRef.current) {
      applyMapTheme(ymapRef.current, theme)
    }
  }, [theme])

  /* ── Add placemarks when data + map are ready ─────────────────────────── */

  useEffect(() => {
    if (!mapReady || !ymapRef.current || businesses.length === 0) return

    const map = ymapRef.current
    map.geoObjects.removeAll()

    // Add business placemarks
    businesses.forEach((biz, index) => {
      const isActive = index === 2 // Highlight one as active (green) like in the design
      const IconComponent = CATEGORY_ICONS[biz.category] || ScissorsIcon
      const iconColor = isActive ? '#1d2d52' : '#F9FAFB'

      const layout = window.ymaps.templateLayoutFactory.createClass(
        `<div class="${styles.priceBubble} ${isActive ? styles.priceBubbleActive : ''}" data-biz-index="${index}">
          <span class="${styles.priceBubbleText}">${formatPrice(biz.priceFrom)}</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="3" cy="3" r="2" stroke="${iconColor}" stroke-width="1"/>
            <circle cx="3" cy="9" r="2" stroke="${iconColor}" stroke-width="1"/>
            <path d="M11 1L5 6M11 11L5 6" stroke="${iconColor}" stroke-width="1" stroke-linecap="round"/>
          </svg>
        </div>`
      )

      const placemark = new window.ymaps.Placemark(
        [biz.lat, biz.lng],
        { bizIndex: index },
        {
          iconLayout: layout,
          iconShape: {
            type: 'Rectangle',
            coordinates: [[-40, -15], [40, 15]],
          },
        }
      )

      placemark.events.add('click', () => {
        setActiveCardIndex(index)
        scrollCarouselTo(index)
      })

      map.geoObjects.add(placemark)
    })

    // Add user location dot
    const userDotLayout = window.ymaps.templateLayoutFactory.createClass(
      `<div style="position:relative;width:16px;height:16px;">
        <div style="position:absolute;width:40px;height:40px;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(189,255,74,0.2);border-radius:50%;pointer-events:none;"></div>
        <div style="width:16px;height:16px;background:#9AD240;border:2px solid #18191B;border-radius:50%;box-shadow:0px 4px 6px -1px rgba(0,0,0,0.1);position:relative;z-index:1;"></div>
      </div>`
    )

    const userPlacemark = new window.ymaps.Placemark(
      [41.2995, 69.2401], // Slightly south
      {},
      {
        iconLayout: userDotLayout,
        iconShape: {
          type: 'Circle',
          coordinates: [8, 8],
          radius: 20,
        },
      }
    )
    map.geoObjects.add(userPlacemark)
  }, [mapReady, businesses])

  /* ── Carousel scroll ──────────────────────────────────────────────────── */

  const scrollCarouselTo = (index: number) => {
    const carousel = carouselRef.current
    if (!carousel) return
    const cards = carousel.children
    if (cards[index]) {
      (cards[index] as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start',
      })
    }
  }

  const handleCardClick = (biz: NearbyBusiness) => {
    navigate(`/business/${biz.businessId}`)
  }

  /* ── Render ────────────────────────────────────────────────────────────── */

  return (
    <div className={styles.page}>
      {/* Yandex Map */}
      <div ref={mapRef} className={styles.mapContainer} />

      {/* Header: Search + Filters */}
      <div className={styles.header}>
        <div className={styles.searchRow}>
          <div
            className={styles.searchBox}
            onClick={() => navigate('/search')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/search')}
          >
            <span className={styles.searchIcon}>
              <SearchIcon />
            </span>
            <span className={styles.searchPlaceholder}>Найти барбера</span>
          </div>
        </div>

        <div className={styles.filtersRow}>
          {/* Filters button — placeholder for future filter modal */}
          <button className={styles.filterPill} onClick={() => navigate('/search')}>
            <span className={styles.filterIcon}>
              <FilterLinesIcon />
            </span>
            <span className={styles.filterPillLabel}>Filters</span>
          </button>

          {/* Price dropdown — navigate to search with price filter */}
          <button className={styles.filterPill} onClick={() => navigate('/search')}>
            <span className={styles.filterPillLabel}>Price</span>
            <span className={styles.filterIcon}>
              <ChevronDownIcon />
            </span>
          </button>

          {/* Active filter: Type: Hair */}
          <button
            className={`${styles.filterPill} ${styles.filterPillActive}`}
            onClick={() => setActiveFilter(activeFilter === 'hair' ? null : 'hair')}
          >
            <span className={styles.filterPillLabel}>Type: Hair</span>
            <span className={styles.filterIcon}>
              <CloseSmallIcon />
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Card Carousel */}
      <div className={styles.carouselLayer}>
        <div className={styles.carousel} ref={carouselRef}>
          {businesses.map((biz, index) => (
            <div
              key={biz.id}
              className={styles.mapCard}
              onClick={() => handleCardClick(biz)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleCardClick(biz)}
            >
              <div className={styles.mapCardImage}>
                {biz.photoUrl ? (
                  <img src={biz.photoUrl} alt={biz.name} loading="lazy" />
                ) : (
                  <div className={styles.mapCardImageFallback} />
                )}
              </div>
              <div className={styles.mapCardBody}>
                <div className={styles.mapCardTitleRow}>
                  <span className={styles.mapCardTitle}>{biz.name}</span>
                  <div className={styles.mapCardRating}>
                    <StarIcon />
                    <span className={styles.mapCardRatingText}>{biz.rating}</span>
                  </div>
                </div>
                <div className={styles.mapCardMeta}>
                  <span className={styles.mapCardSubtitle}>
                    {biz.categoryLabel} • {formatDistance(biz.distanceMeters)}
                  </span>
                  <div className={styles.mapCardPriceRow}>
                    <span className={styles.mapCardPriceIcon}>
                      <TagIcon />
                    </span>
                    <span className={styles.mapCardPriceText}>
                      {formatPriceFrom(biz.priceFrom)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
