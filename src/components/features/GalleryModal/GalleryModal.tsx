import { useState, useRef, useCallback, useEffect } from 'react'
import type { Master } from '@/lib/api/types'
import styles from './GalleryModal.module.css'

export interface GalleryPhoto {
  id: string
  url: string
  type: 'salon' | 'portfolio'
  master_id: string | null
  masters?: { id: string; name: string } | null
}

interface GalleryModalProps {
  photos: GalleryPhoto[]
  masters: Master[]
  initialTab?: 'salon' | 'portfolio'
  initialIndex?: number
  onClose: () => void
}

export default function GalleryModal({
  photos,
  masters,
  initialTab = 'salon',
  initialIndex = 0,
  onClose,
}: GalleryModalProps) {
  const [tab, setTab] = useState<'salon' | 'portfolio'>(initialTab)
  const [masterFilter, setMasterFilter] = useState<string | null>(null)
  const [currentIdx, setCurrentIdx] = useState(initialIndex)

  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const touchStartY = useRef(0)

  const salonPhotos = photos.filter(p => p.type === 'salon')
  const portfolioPhotos = photos.filter(p => {
    if (p.type !== 'portfolio') return false
    if (masterFilter) return p.master_id === masterFilter
    return true
  })
  const activePhotos = tab === 'salon' ? salonPhotos : portfolioPhotos

  // Portfolio masters deduplicated
  const portfolioMasters = masters.filter(m =>
    photos.some(p => p.type === 'portfolio' && p.master_id === m.id)
  )

  useEffect(() => {
    setCurrentIdx(0)
  }, [tab, masterFilter])

  const prev = useCallback(() => {
    if (currentIdx > 0) setCurrentIdx(i => i - 1)
  }, [currentIdx])

  const next = useCallback(() => {
    if (currentIdx < activePhotos.length - 1) setCurrentIdx(i => i + 1)
  }, [currentIdx, activePhotos.length])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) {
      if (diff > 0) next()
      else prev()
    }
  }

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  // Block scroll when open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next, onClose])

  const currentPhoto = activePhotos[currentIdx] ?? null

  return (
    <div className={styles.overlay} onClick={handleBackdrop}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tabBtn} ${tab === 'salon' ? styles.tabBtnActive : ''}`}
            onClick={() => setTab('salon')}
          >
            Салон
            {salonPhotos.length > 0 && <span className={styles.tabCount}>{salonPhotos.length}</span>}
          </button>
          <button
            className={`${styles.tabBtn} ${tab === 'portfolio' ? styles.tabBtnActive : ''}`}
            onClick={() => setTab('portfolio')}
          >
            Портфолио
            {portfolioPhotos.length > 0 && <span className={styles.tabCount}>{photos.filter(p => p.type === 'portfolio').length}</span>}
          </button>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Master filter chips — portfolio only */}
      {tab === 'portfolio' && portfolioMasters.length > 1 && (
        <div className={styles.masterFilter}>
          <button
            className={`${styles.masterChip} ${masterFilter === null ? styles.masterChipActive : ''}`}
            onClick={() => setMasterFilter(null)}
          >
            Все мастера
          </button>
          {portfolioMasters.map(m => (
            <button
              key={m.id}
              className={`${styles.masterChip} ${masterFilter === m.id ? styles.masterChipActive : ''}`}
              onClick={() => setMasterFilter(m.id)}
            >
              {m.name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {/* Main photo viewer */}
      <div
        className={styles.viewer}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleBackdrop}
      >
        {activePhotos.length === 0 ? (
          <div className={styles.empty}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="4" y="10" width="40" height="30" rx="4" stroke="currentColor" strokeWidth="2" />
              <circle cx="17" cy="20" r="4" stroke="currentColor" strokeWidth="2" />
              <path d="M4 34L14 24L20 30L28 22L44 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p>Нет фотографий</p>
          </div>
        ) : (
          <img
            key={currentPhoto?.url}
            src={currentPhoto?.url}
            alt=""
            className={styles.photo}
            onClick={e => e.stopPropagation()}
          />
        )}
      </div>

      {/* Thumbnails strip */}
      {activePhotos.length > 1 && (
        <div className={styles.thumbStrip}>
          {activePhotos.map((p, i) => (
            <button
              key={p.id}
              className={`${styles.thumb} ${i === currentIdx ? styles.thumbActive : ''}`}
              onClick={e => { e.stopPropagation(); setCurrentIdx(i) }}
            >
              <img src={p.url} alt="" />
            </button>
          ))}
        </div>
      )}

      {/* Counter */}
      {activePhotos.length > 1 && (
        <div className={styles.counter}>
          {currentIdx + 1} / {activePhotos.length}
        </div>
      )}

      {/* Prev/Next arrows (desktop/tablet) */}
      {activePhotos.length > 1 && currentIdx > 0 && (
        <button className={`${styles.arrow} ${styles.arrowLeft}`} onClick={e => { e.stopPropagation(); prev() }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}
      {activePhotos.length > 1 && currentIdx < activePhotos.length - 1 && (
        <button className={`${styles.arrow} ${styles.arrowRight}`} onClick={e => { e.stopPropagation(); next() }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  )
}
