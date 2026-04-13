/**
 * CitySelector — modal sheet for picking city/region.
 * Slides up from bottom, list of Uzbekistan cities.
 */

import { useState, useEffect, useRef } from 'react'
import { useCityStore, UZBEKISTAN_CITIES, type City } from '@/stores/cityStore'
import { useOverlayStore } from '@/stores/overlayStore'
import styles from './CitySelector.module.css'

interface CitySelectorProps {
  open: boolean
  onClose: () => void
}

export default function CitySelector({ open, onClose }: CitySelectorProps) {
  const { city, setCity } = useCityStore()
  const { open: openOverlay, close: closeOverlay } = useOverlayStore()
  const [search, setSearch] = useState('')
  const overlayRef = useRef<HTMLDivElement>(null)

  const filtered = UZBEKISTAN_CITIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (c: City) => {
    setCity(c)
    handleClose()
  }

  const handleOpen = () => {
    openOverlay()
  }

  const handleClose = () => {
    closeOverlay()
    onClose()
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) handleClose()
  }

  // Reset search when opened, notify overlay
  useEffect(() => {
    if (open) {
      setSearch('')
      handleOpen()
    } else {
      closeOverlay()
    }
  }, [open])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Выбор города"
    >
      <div className={styles.sheet}>
        <div className={styles.header}>
          <h2 className={styles.title}>Выберите город</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className={styles.searchWrap}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={styles.searchIcon}>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Поиск города..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className={styles.list}>
          {filtered.length === 0 ? (
            <p className={styles.empty}>Ничего не найдено</p>
          ) : (
            filtered.map(c => (
              <button
                key={c.id}
                className={`${styles.cityItem} ${c.id === city.id ? styles.cityItemActive : ''}`}
                onClick={() => handleSelect(c)}
              >
                <span className={styles.cityName}>{c.name}</span>
                {c.id === city.id && (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M4 9L7.5 12.5L14 5.5" stroke="#9AD240" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
