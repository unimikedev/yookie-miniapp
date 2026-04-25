/**
 * PhotoSwipe — swipeable photo carousel with N/N counter, thumbnails and slide animation.
 * Used on ProviderDetailPage and MasterDetailPage hero sections.
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
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null)
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
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > diffY * 1.5) {
      if (diffX > 0 && current < photos.length - 1) {
        setSlideDir('right')
        setCurrent(p => p + 1)
      } else if (diffX < 0 && current > 0) {
        setSlideDir('left')
        setCurrent(p => p - 1)
      }
    }
  }, [current, photos.length])

  const goTo = useCallback((idx: number) => {
    if (idx === current) return
    setSlideDir(idx > current ? 'right' : 'left')
    setCurrent(idx)
  }, [current])

  if (!photos.length) return null
  if (photos.length === 1) {
    return (
      <div className={`${styles.swipeWrap} ${className ?? ''}`} style={{ height }}>
        <img src={photos[0]} alt={alt} className={styles.photo} />
      </div>
    )
  }

  const slideClass = slideDir === 'right' ? styles.slideRight : slideDir === 'left' ? styles.slideLeft : ''

  return (
    <div
      className={`${styles.swipeWrap} ${className ?? ''}`}
      style={{ height }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <img key={current} src={photos[current]} alt={alt} className={`${styles.photo} ${slideClass}`} />

      {/* N/N counter — top-right */}
      <div className={styles.counter}>{current + 1}/{photos.length}</div>

      {/* Dots pager — centered bottom */}
      <div className={styles.dots}>
        {photos.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
            onClick={(e) => { e.stopPropagation(); goTo(i) }}
            aria-label={`Фото ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
