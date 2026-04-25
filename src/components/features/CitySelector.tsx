/**
 * CitySelector — modal sheet for picking city/region.
 * Slides up from bottom, list of Uzbekistan cities.
 * Tashkent opens a districts sub-screen (soft filter — priority, not exclusion).
 */

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useCityStore, UZBEKISTAN_CITIES, TASHKENT_DISTRICTS, type City, type TashkentDistrict } from '@/stores/cityStore'
import { useOverlayStore } from '@/stores/overlayStore'
import styles from './CitySelector.module.css'

interface CitySelectorProps {
  open: boolean
  onClose: () => void
}

export default function CitySelector({ open, onClose }: CitySelectorProps) {
  const { t } = useTranslation()
  const { city, district, setCity, setDistrict } = useCityStore()
  const { open: openOverlay, close: closeOverlay } = useOverlayStore()
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'cities' | 'districts'>('cities')
  const overlayRef = useRef<HTMLDivElement>(null)

  const filtered = UZBEKISTAN_CITIES.filter(c =>
    t(`cities.${c.id}`).toLowerCase().includes(search.toLowerCase())
  )

  const handleClose = () => {
    closeOverlay()
    onClose()
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) handleClose()
  }

  const handleCitySelect = (c: City) => {
    setCity(c)
    if (c.id === 'Tashkent') {
      setView('districts')
    } else {
      handleClose()
    }
  }

  const handleDistrictSelect = (d: TashkentDistrict | null) => {
    setDistrict(d)
    handleClose()
  }

  const handleOpen = () => {
    openOverlay()
  }

  useEffect(() => {
    if (open) {
      setSearch('')
      handleOpen()
      setView(city.id === 'Tashkent' ? 'districts' : 'cities')
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
      aria-label={t('citySelector.title')}
    >
      {view === 'districts' ? (
        <div className={styles.sheet}>
          <div className={styles.header}>
            <button
              className={styles.backBtn}
              onClick={() => setView('cities')}
              aria-label={t('citySelector.citiesBack')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 13L5 8L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t('citySelector.citiesBack')}
            </button>
            <h2 className={styles.title}>{t('citySelector.districtsTitle')}</h2>
            <button className={styles.closeBtn} onClick={handleClose} aria-label={t('common.close')}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <p className={styles.districtHint}>{t('citySelector.districtHint')}</p>

          <div className={styles.list}>
            <button
              className={`${styles.cityItem} ${!district ? styles.cityItemActive : ''}`}
              onClick={() => handleDistrictSelect(null)}
            >
              <span className={styles.cityName}>{t('citySelector.allCity')}</span>
              {!district && (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M4 9L7.5 12.5L14 5.5" stroke="#6BCEFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            {TASHKENT_DISTRICTS.map(d => (
              <button
                key={d.id}
                className={`${styles.cityItem} ${district?.id === d.id ? styles.cityItemActive : ''}`}
                onClick={() => handleDistrictSelect(d)}
              >
                <span className={styles.cityName}>{t(`districts.${d.id}`)}</span>
                {district?.id === d.id && (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M4 9L7.5 12.5L14 5.5" stroke="#6BCEFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.sheet}>
          <div className={styles.header}>
            <h2 className={styles.title}>{t('citySelector.title')}</h2>
            <button className={styles.closeBtn} onClick={onClose} aria-label={t('common.close')}>
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
              placeholder={t('citySelector.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className={styles.list}>
            {filtered.length === 0 ? (
              <p className={styles.empty}>{t('citySelector.notFound')}</p>
            ) : (
              filtered.map(c => (
                <button
                  key={c.id}
                  className={`${styles.cityItem} ${c.id === city.id ? styles.cityItemActive : ''}`}
                  onClick={() => handleCitySelect(c)}
                >
                  <span className={styles.cityName}>
                    {t(`cities.${c.id}`)}
                    {c.id === 'Tashkent' && (
                      <span className={styles.cityDistrict}>
                        {district ? ` · ${t(`districts.${district.id}`)}` : ` · ${t('citySelector.districtsTitle').toLowerCase()} →`}
                      </span>
                    )}
                  </span>
                  {c.id === city.id && !district && (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M4 9L7.5 12.5L14 5.5" stroke="#6BCEFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {c.id === 'Tashkent' && c.id !== city.id && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M5 3L10 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
