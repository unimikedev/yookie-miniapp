/**
 * Home screen UI primitives.
 * All cards are presentational: data shape comes from `useHomeData`.
 */

import React, { useRef, useEffect, useState } from 'react'
import styles from './home.module.css'
import type {
  VisitedMasterCard,
  NearbyBusinessCard,
  PopularMasterCard,
  PopularStudioCard,
  HomeFilterChip,
} from '@/lib/api/home'
import { formatMasterName } from '@/lib/utils/name'

/* ── formatters ─────────────────────────────────────────── */
const formatDistance = (m: number): string =>
  m < 1000 ? `${m} м` : `${(m / 1000).toFixed(1).replace('.', ',')} км`

const formatPriceFrom = (price: number): string =>
  `от ${Math.round(price / 1000)} тыс.`

/* ── icons ──────────────────────────────────────────────── */
const StarIcon = ({ color = '#6BCEFF' }: { color?: string }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path
      d="M6 0.5L7.545 3.63L11 4.135L8.5 6.57L9.09 10.01L6 8.385L2.91 10.01L3.5 6.57L1 4.135L4.455 3.63L6 0.5Z"
      fill={color}
    />
  </svg>
)

const HeartIcon = ({ filled = false, size = 18 }: { filled?: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 18" fill="none">
    <path
      d="M10 17.5C9.7 17.5 9.4 17.4 9.14 17.2L1.5 10.5C0.53 9.58 0 8.33 0 7C0 4.24 2.24 2 5 2C6.9 2 8.57 3.11 9.4 4.7C9.54 4.88 9.76 5 10 5C10.24 5 10.46 4.88 10.6 4.7C11.43 3.11 13.1 2 15 2C17.76 2 20 4.24 20 7C20 8.33 19.47 9.58 18.5 10.5L10.86 17.2C10.6 17.4 10.3 17.5 10 17.5Z"
      fill={filled ? '#6BCEFF' : '#F9FAFB'}
    />
  </svg>
)

const ArrowRight = () => (
  <svg width="6" height="11" viewBox="0 0 6 11" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1.17 10.94L0 10L3.63 5.47L0 0.94L1.17 0L5.55 5.47L1.17 10.94Z"
      fill="#9CA3AF"
    />
  </svg>
)

const ArrowsUpDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M7 4V20M7 20L3 16M7 20L11 16M17 20V4M17 4L13 8M17 4L21 8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/* ── SectionHeader ──────────────────────────────────────── */
export interface SectionHeaderProps {
  title: string
  onMoreClick?: () => void
  moreLabel?: string
}

export function SectionHeader({
  title,
  onMoreClick,
  moreLabel = 'Все',
}: SectionHeaderProps) {
  return (
    <div className={styles.sectionHeader}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {onMoreClick && (
        <button className={styles.sectionMore} onClick={onMoreClick}>
          <span>{moreLabel}</span>
          <ArrowRight />
        </button>
      )}
    </div>
  )
}

/* ── HomeCategoryChip ───────────────────────────────────── */
export interface HomeCategoryChipProps {
  label: string
  iconSrc: string
  onClick?: () => void
  active?: boolean
}

export function HomeCategoryChip({ label, iconSrc, onClick, active = false }: HomeCategoryChipProps) {
  return (
    <div className={`${styles.catChip} ${active ? styles.catChipActive : ''}`}>
      <button className={styles.catChipBtn} onClick={onClick} aria-label={label} data-active={active}>
        <span className={styles.catChipIcon}>
          <img src={iconSrc} alt="" className={styles.catChipImage} />
        </span>
      </button>
      <span className={styles.catChipLabel}>{label}</span>
    </div>
  )
}

/* ── MasterCard — unified master card (visited & popular) ─────────────────────────── */
export interface MasterCardProps {
  item: VisitedMasterCard | PopularMasterCard
  onClick?: () => void
  showLastVisit?: boolean
}

export function MasterCard({ item, onClick, showLastVisit = false }: MasterCardProps) {
  const isVisitedItem = 'masterName' in item
  const name = isVisitedItem ? formatMasterName((item as VisitedMasterCard).masterName) : (item as PopularMasterCard).name
  const specialization = isVisitedItem 
    ? (item as VisitedMasterCard).specialization 
    : `${(item as PopularMasterCard).specialization} · ${(item as PopularMasterCard).businessName || ''}`
  
  return (
    <div className={styles.masterCard} onClick={onClick} role="button" tabIndex={0}>
      <div className={styles.masterPhotoWrap} aria-hidden="true">
        {item.photoUrl && (
          <img className={styles.masterPhoto} src={item.photoUrl} alt="" />
        )}
      </div>
      <div className={styles.masterBody}>
        <div className={styles.masterTop}>
          <span className={styles.masterName}>{name}</span>
          {isVisitedItem && (
            <span className={styles.masterRating}>
              <StarIcon />
              {item.rating.toFixed(1)}
            </span>
          )}
        </div>
        <span className={styles.masterMeta}>
          {specialization}
        </span>
        {!isVisitedItem && (item as PopularMasterCard).priceFrom && (
          <span className={styles.masterPriceRow}>
            <span className={styles.masterRatingSmall}>
              <StarIcon />
              {item.rating.toFixed(1)}
            </span>
            <span className={styles.masterPriceSeparator}>•</span>
            <span className={styles.masterPrice}>от {Math.round((item as PopularMasterCard).priceFrom / 1000)} тыс.</span>
          </span>
        )}
      </div>
    </div>
  )
}

/* ── NearbyCard ─────────────────────────────────────────── */
export interface NearbyCardProps {
  item: NearbyBusinessCard
  onClick?: () => void
  compact?: boolean
}

export function NearbyCard({ item, onClick, compact }: NearbyCardProps) {
  return (
    <div
      className={`${styles.nearbyCard} ${compact ? styles.nearbyCardCompact : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className={styles.nearbyThumb} aria-hidden="true">
        {item.photoUrl && (
          <img className={styles.nearbyThumbImg} src={item.photoUrl} alt="" />
        )}
      </div>
      <div className={styles.nearbyInfo}>
        <div className={styles.nearbyTop}>
          <span className={styles.nearbyName}>{item.name}</span>
          {!compact && (
            <span className={styles.nearbyRating}>
              <StarIcon />
              {item.rating.toFixed(1)}
            </span>
          )}
        </div>
        {compact ? (
          <>
            <span className={styles.nearbyMeta}>
              {item.formatLabel ?? item.categoryLabel} · до {item.openUntil ?? '00:00'}
            </span>
            <div className={styles.nearbyRatingRow}>
              <StarIcon />
              <span>{item.rating.toFixed(1)}</span>
              <span> · </span>
              <span className={styles.nearbyDistance}>{formatDistance(item.distanceMeters)}</span>
            </div>
          </>
        ) : (
          <>
            <span className={styles.nearbyMeta}>
              {item.categoryLabel} • {formatDistance(item.distanceMeters)}
            </span>
            <span className={styles.nearbyPrice}>{formatPriceFrom(item.priceFrom)}</span>
          </>
        )}
      </div>
    </div>
  )
}

/* ── PopularMasterCardView — uses unified master card styles ─────────────────────────── */
export interface PopularMasterCardViewProps {
  item: PopularMasterCard
  onClick?: () => void
}

export function PopularMasterCardView({ item, onClick }: PopularMasterCardViewProps) {
  return (
    <div
      className={styles.masterCard}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className={styles.masterPhotoWrap} aria-hidden="true">
        {item.photoUrl && (
          <img className={styles.masterPhoto} src={item.photoUrl} alt="" />
        )}
      </div>
      <div className={styles.masterBody}>
        <div className={styles.masterTop}>
          <span className={styles.masterName}>{formatMasterName(item.name)}</span>
        </div>
        <span className={styles.masterMeta}>
          {item.specialization} · {item.businessName || ''}
        </span>
        <span className={styles.masterPrice}>от {Math.round(item.priceFrom / 1000)} тыс.</span>
      </div>
    </div>
  )
}

/* ── PopularStudioCardView ──────────────────────────────── */
export interface PopularStudioCardViewProps {
  item: PopularStudioCard
  onClick?: () => void
  onToggleFavorite?: () => void
  isFavorite?: boolean
}

export function PopularStudioCardView({
  item,
  onClick,
  onToggleFavorite,
  isFavorite = false,
}: PopularStudioCardViewProps) {
  const allPhotos = [item.photoUrl, ...(item.photos || [])].filter(Boolean) as string[]
  const [currentPhoto, setCurrentPhoto] = useState(0)
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const touchStartY = useRef(0)
  const touchEndY = useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    touchEndX.current = e.touches[0].clientX
    touchEndY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
    touchEndY.current = e.touches[0].clientY
  }

  const handleTouchEnd = () => {
    const diffX = touchStartX.current - touchEndX.current
    const diffY = Math.abs(touchStartY.current - touchEndY.current)
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > diffY * 1.5) {
      if (diffX > 0 && currentPhoto < allPhotos.length - 1) {
        setSlideDir('right')
        setCurrentPhoto(p => p + 1)
      } else if (diffX < 0 && currentPhoto > 0) {
        setSlideDir('left')
        setCurrentPhoto(p => p - 1)
      }
    }
  }

  const showThumbnails = allPhotos.length > 1
  const slideClass = slideDir === 'right' ? styles.slideRight : slideDir === 'left' ? styles.slideLeft : ''

  return (
    <div
      className={styles.psCard}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div
        className={styles.psCoverWrap}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {allPhotos[currentPhoto] && (
          <img key={currentPhoto} className={`${styles.psCover} ${slideClass}`} src={allPhotos[currentPhoto]} alt={item.name} />
        )}
        <button
          className={styles.psFav}
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite?.()
          }}
          aria-label="В избранное"
        >
          <HeartIcon filled={isFavorite} size={20} />
        </button>
        {showThumbnails && (
          <div className={styles.psThumbnails}>
            {allPhotos.slice(0, 3).map((photo, idx) => (
              <img
                key={idx}
                className={`${styles.psThumbnail} ${idx === currentPhoto ? styles.psThumbnailActive : ''}`}
                src={photo}
                alt=""
                onClick={(e) => {
                  e.stopPropagation()
                  setSlideDir(idx > currentPhoto ? 'right' : 'left')
                  setCurrentPhoto(idx)
                }}
              />
            ))}
            {allPhotos.length > 3 && (
              <div className={styles.psThumbnailMore}>+{allPhotos.length - 3}</div>
            )}
          </div>
        )}
      </div>
      <div className={styles.psBody}>
        <div className={styles.psTopRow}>
          <div className={styles.psInfo}>
            <div className={styles.psNameRatingWrap}>
              <span className={styles.psName}>{item.name}</span>
              <span className={styles.psRatingRow}>
                <StarIcon />
                {item.rating.toFixed(1)}
                <span className={styles.psReviewCount}>({item.reviewCount} отзывов)</span>
              </span>
            </div>
          </div>
          {item.priceFrom && (
            <div className={styles.psPrice}>
              <span className={styles.psPriceFrom}>от</span>
              <span className={styles.psPriceValue}>{Math.round(item.priceFrom / 1000)} тыс.</span>
            </div>
          )}
          <span className={styles.psBadge}>{item.categoryLabel}</span>
        </div>
      </div>
    </div>
  )
}

/* ── MapPreviewCardView ─────────────────────────────────── */
export interface MapPreviewCardProps {
  nearbyCount: number
  onClick?: () => void
}

export function MapPreviewCardView({ nearbyCount, onClick }: MapPreviewCardProps) {
  return (
    <div
      className={styles.mapCard}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className={styles.mapCardBg} aria-hidden="true" />
      <div className={styles.mapCardContent}>
        <span className={styles.mapCardTitle}>На карте</span>
        <span className={styles.mapCardSub}>{nearbyCount} мест рядом</span>
      </div>
    </div>
  )
}

/* ── HomeFilterChipsRow ─────────────────────────────────── */
export interface HomeFilterChipsProps {
  chips: HomeFilterChip[]
  activeFilters?: Set<string>
  onFilterClick?: (key: string) => void
}

export function HomeFilterChipsRow({
  chips,
  activeFilters = new Set(),
  onFilterClick,
}: HomeFilterChipsProps) {
  return (
    <div className={styles.filterScroll}>
      {chips.map((c) => (
        <button
          key={c.key}
          className={styles.filterChip}
          onClick={() => onFilterClick?.(c.key)}
          data-active={activeFilters.has(c.key)}
        >
          {c.icon === 'arrows' ? (
            <span className={styles.filterChipIcon}>
              <ArrowsUpDown />
            </span>
          ) : null}
          {c.label !== '' && <span>{c.label}</span>}
        </button>
      ))}
    </div>
  )
}

/* ── HScroll wrapper ────────────────────────────────────── */
export function HScroll({
  children,
  snap = false,
  autoScroll = false,
  className
}: {
  children: React.ReactNode
  snap?: boolean
  autoScroll?: boolean
  className?: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!autoScroll || !scrollRef.current) return

    const container = scrollRef.current
    let animationId: number
    let isPaused = false

    const scroll = () => {
      if (!isPaused && container.scrollWidth > container.clientWidth) {
        container.scrollLeft += 1
        // Reset when we've scrolled past all items
        if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 1) {
          container.scrollLeft = 0
        }
      }
      animationId = requestAnimationFrame(scroll)
    }

    // Pause on user interaction
    const handleTouchStart = () => { isPaused = true }
    const handleTouchEnd = () => {
      setTimeout(() => { isPaused = false }, 2000)
    }
    const handleMouseEnter = () => { isPaused = true }
    const handleMouseLeave = () => { isPaused = false }

    container.addEventListener('touchstart', handleTouchStart)
    container.addEventListener('touchend', handleTouchEnd)
    container.addEventListener('mouseenter', handleMouseEnter)
    container.addEventListener('mouseleave', handleMouseLeave)

    animationId = requestAnimationFrame(scroll)

    return () => {
      cancelAnimationFrame(animationId)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('mouseenter', handleMouseEnter)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [autoScroll])

  return (
    <div
      ref={scrollRef}
      className={`${styles.hScroll} ${snap ? styles.hScrollSnap : ''} ${className ?? ''}`}
    >
      {children}
    </div>
  )
}
