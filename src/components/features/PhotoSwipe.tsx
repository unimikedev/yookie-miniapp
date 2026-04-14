/**
 * PhotoSwipe — swipeable photo carousel with thumbnail indicators.
 * Used on BusinessDetailPage and MasterDetailPage hero sections.
 */

import { useState, useRef, useCallback } from 'react'
import styles from './PhotoSwipe.module.css'

interface PhotoSwipeProps {
  photos: string[]
  alt?: string
  className?: string
  height?: number
}

export default function PhotoSwipe({ photos, alt, className, height }: PhotoSwipeProps) {
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const touchStartY = useRef(0)
  const touchEndY = useRef(0)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    touchEndX.current = e.touches[0].clientX
    touchEndY.current = e.touches[0].clientY
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
    touchEndY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback(() => {
    const diffX = touchStartX.current - touchEndX.current
    const diffY = Math.abs(touchStartY.current - touchEndY.current)
    // Only handle horizontal swipes (ignore vertical scrolls)
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > diffY * 1.5) {
      if (diffX > 0 && current < photos.length - 1) {
        setCurrent(p => p + 1)
      } else if (diffX < 0 && current > 0) {
        setCurrent(p => p - 1)
      }
    }
  }, [current, photos.length])

  if (!photos.length) return null
  if (photos.length === 1) {
    return (
      <div className={`${styles.swipeWrap} ${className ?? ''}`} style={{ height }}>
        <img src={photos[0]} alt={alt} className={styles.photo} />
      </div>
    )
  }

  const showThumbnails = photos.length > 1

  return (
    <div
      className={`${styles.swipeWrap} ${className ?? ''}`}
      style={{ height }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <img src={photos[current]} alt={alt} className={styles.photo} />

      {/* Dots pager — centered */}
      <div className={styles.dots}>
        {photos.map((_, i) => (
          <span key={i} className={`${styles.dot} ${i === current ? styles.dotActive : ''}`} />
        ))}
      </div>

      {/* Thumbnails — right-aligned */}
      {showThumbnails && (
        <div className={styles.thumbnails}>
          {photos.slice(0, 3).map((photo, idx) => (
            <img
              key={idx}
              className={`${styles.thumbnail} ${idx === current ? styles.thumbnailActive : ''}`}
              src={photo}
              alt=""
              onClick={(e) => {
                e.stopPropagation()
                setCurrent(idx)
              }}
            />
          ))}
          {photos.length > 3 && (
            <div className={styles.thumbnailMore}>+{photos.length - 3}</div>
          )}
        </div>
      )}
    </div>
  )
}
