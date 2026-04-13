/**
 * HomePage — Figma "Главная" (node 184:6540).
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHomeData } from '@/hooks/useHomeData'
import { useVisitedMasters } from '@/hooks/useVisitedMasters'
import { useFavoritesStore } from '@/stores/favoritesStore'
import { useCityStore } from '@/stores/cityStore'
import { useThemeStore } from '@/stores/themeStore'
import { useAuthStore } from '@/stores/authStore'
import { Skeleton } from '@/shared/ui'
import CitySelector from '@/components/features/CitySelector'
import {
  SectionHeader,
  HomeCategoryChip,
  VisitedCard,
  NearbyCard,
  PopularMasterCardView,
  PopularStudioCardView,
  HomeFilterChipsRow,
  HScroll,
} from '@/components/features/home'
import type { CategoryEnum } from '@/lib/api/types'
import type { HomeFilterChip } from '@/lib/api/home'
import { CATEGORIES } from '@/shared/constants'
import styles from './HomePage.module.css'

const TYPING_WORDS = ['барбера', 'мастера', 'салон', 'маникюр', 'стрижку', 'массаж']

const FILTER_CHIPS: HomeFilterChip[] = [
  { key: 'sort', label: '', icon: 'arrows' },
  { key: 'promo', label: 'Акции' },
  { key: 'nearby', label: 'Рядом' },
  { key: 'available', label: 'Свободен' },
  { key: 'top_rated', label: 'Высокий рейтинг' },
]

/* ── SVG Icons ──────────────────────────────────────────── */

const LocationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
    <path
      d="M11 1C6.58 1 3 4.58 3 9C3 14.25 11 21 11 21S19 14.25 19 9C19 4.58 15.42 1 11 1ZM11 12C9.34 12 8 10.66 8 9C8 7.34 9.34 6 11 6C12.66 6 14 7.34 14 9C14 10.66 12.66 12 11 12Z"
      fill="currentColor"
    />
  </svg>
)

const HeartIconLarge = () => (
  <svg width="20" height="18" viewBox="0 0 20 18" fill="none">
    <path
      d="M10 17.5C9.7 17.5 9.4 17.4 9.14 17.2L1.5 10.5C0.53 9.58 0 8.33 0 7C0 4.24 2.24 2 5 2C6.9 2 8.57 3.11 9.4 4.7C9.54 4.88 9.76 5 10 5C10.24 5 10.46 4.88 10.6 4.7C11.43 3.11 13.1 2 15 2C17.76 2 20 4.24 20 7C20 8.33 19.47 9.58 18.5 10.5L10.86 17.2C10.6 17.4 10.3 17.5 10 17.5Z"
      fill="#9AD240"
    />
  </svg>
)

const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke="#6B7280" strokeWidth="2" />
    <path d="M21 21L16.5 16.5" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

/**
 * TypingPlaceholder — animated placeholder that types different words
 */
function TypingPlaceholder() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentWord = TYPING_WORDS[currentWordIndex]
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (currentCharIndex < currentWord.length) {
          setCurrentCharIndex(currentCharIndex + 1)
        } else {
          setTimeout(() => setIsDeleting(true), 1500)
        }
      } else {
        if (currentCharIndex > 0) {
          setCurrentCharIndex(currentCharIndex - 1)
        } else {
          setIsDeleting(false)
          setCurrentWordIndex((currentWordIndex + 1) % TYPING_WORDS.length)
        }
      }
    }, isDeleting ? 80 : 120)
    return () => clearTimeout(timeout)
  }, [currentCharIndex, currentWordIndex, isDeleting])

  const currentWord = TYPING_WORDS[currentWordIndex]
  const typedText = currentWord.substring(0, currentCharIndex)

  return (
    <>
      <span className={styles.searchPlaceholderStatic}>Найти </span>
      <span className={styles.searchPlaceholderTyped}>
        {typedText}
        <span className={styles.typingCursor} />
      </span>
    </>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const { data, isLoading } = useHomeData()
  const { visited: apiVisited, isLoading: visitedLoading } = useVisitedMasters()
  const { toggle, isFavorite } = useFavoritesStore()
  const { city } = useCityStore()
  const { theme, toggle: toggleTheme } = useThemeStore()
  const authStore = useAuthStore()
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<CategoryEnum | null>(null)
  const [citySelectorOpen, setCitySelectorOpen] = useState(false)

  // Map API visited data to VisitedMasterCard shape
  const visitedCards = apiVisited.length > 0
    ? apiVisited.flatMap((vb) =>
        vb.masters.map((m) => ({
          id: `visited-${vb.businessId}-${m.id}`,
          masterName: m.name,
          businessName: vb.businessName,
          specialization: m.specialization ?? '',
          distanceMeters: 0,
          priceFrom: 0,
          rating: m.rating,
          photoUrl: m.photoUrl,
          hasSlotsToday: true,
          businessId: vb.businessId,
          masterId: m.id,
          lastVisitDate: vb.lastVisitAt
            ? new Date(vb.lastVisitAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
            : '',
        }))
      )
    : null

  // Use API visited data when available, fall back to useHomeData mock
  const effectiveVisited = visitedCards ?? data?.visited
  const effectiveVisitedLoading = (visitedCards === null && visitedLoading) || (!data && isLoading)

  const handleFilterClick = (key: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const handleCategoryClick = (catKey: CategoryEnum) => {
    setSelectedCategory(prev => prev === catKey ? null : catKey)
  }

  // Apply ALL active filters to ALL sections
  const getFilteredData = () => {
    if (!data) return data

    let visited = [...(effectiveVisited ?? data.visited)]
    let nearby = [...data.nearby]
    let masters = [...data.popularMasters]
    let studios = [...data.popularStudios]

    if (activeFilters.has('nearby')) {
      visited = visited.filter(v => (v.distanceMeters || 0) < 5000)
      nearby = nearby.filter(n => (n.distanceMeters || 0) < 5000)
      masters = masters.filter(m => (m.distanceMeters || 0) < 5000)
      visited.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0))
      nearby.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0))
      masters.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0))
    }

    if (activeFilters.has('available')) {
      visited = visited.filter(v => v.hasSlotsToday !== false)
      masters = masters.filter(m => (m as any).hasSlotsToday !== false)
    }

    if (activeFilters.has('promo')) {
      nearby = nearby.filter(n => (n as any).hasPromo !== false)
      studios = studios.filter(s => (s as any).hasPromo !== false)
      masters = masters.filter(m => (m as any).hasPromo !== false)
      visited = visited.filter(v => (v as any).hasPromo !== false)
    }

    if (activeFilters.has('top_rated')) {
      visited.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      nearby.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      masters.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      studios.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    }

    if (activeFilters.has('sort')) {
      // Sort by rating (highest first) as default sort
      visited.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      nearby.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      masters.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      studios.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    }

    return { ...data, visited, nearby, popularMasters: masters, popularStudios: studios }
  }

  const filteredData = getFilteredData()
  const hasVisitedData = effectiveVisited && effectiveVisited.length > 0

  if (!filteredData && !effectiveVisitedLoading) {
    return <div className={styles.page}><p>Loading...</p></div>
  }

  const fd = filteredData!

  return (
    <div className={styles.page}>
      <div className={styles.topGradient} aria-hidden="true" />

      <div className={styles.mainContent}>
        {/* Header */}
        <header className={styles.header}>
          <button className={styles.headerBtn} onClick={() => navigate('/favorites')} aria-label="Избранное">
            <HeartIconLarge />
          </button>
          <div className={styles.logoBlock}>
            <img src="/logo.svg" alt="Yookie" className={styles.logoImage} />
            <span className={styles.logoSub}>Маркетплейс оффлайн услуг</span>
          </div>
          <button className={styles.headerBtn} onClick={toggleTheme} aria-label={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}>
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
        </header>

        {/* Search — sticky */}
        <div className={styles.searchWrap}>
          <div className={styles.searchBox} onClick={() => navigate('/search')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/search')}>
            <span className={styles.searchIcon}><SearchIcon /></span>
            <span className={styles.searchPlaceholder}><TypingPlaceholder /></span>
            <button className={styles.cityBadgeInside} onClick={(e) => { e.stopPropagation(); setCitySelectorOpen(true); }} aria-label="Смена города">
              <span>{city.name}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Category chips */}
        <div className={styles.catRow}>
          {CATEGORIES.map((cat) => (
            <HomeCategoryChip key={cat.key} label={cat.label} emoji={cat.emoji} onClick={() => handleCategoryClick(cat.key)} active={selectedCategory === cat.key} />
          ))}
        </div>

        {/* Sections */}
        <div className={styles.sections}>
          {selectedCategory ? (
            /* Category-filtered view: show all matching businesses in a vertical grid */
            <section className={styles.sectionInner}>
              <SectionHeader
                title={CATEGORIES.find(c => c.key === selectedCategory)?.label || ''}
                onMoreClick={() => setSelectedCategory(null)}
                moreLabel="Сбросить"
              />
              {isLoading || !data ? (
                <div className={styles.skeleton}><Skeleton variant="rect" height={246} /></div>
              ) : (() => {
                // Combine: show studios + masters filtered by category
                const allCatItems = [
                  ...fd.nearby.filter(n => n.category === selectedCategory),
                  ...fd.popularStudios.filter(s => s.category === selectedCategory),
                ]

                if (allCatItems.length === 0) {
                  return <p className={styles.emptySection}>Ничего не найдено в этой категории</p>
                }

                return (
                  <div className={styles.visitedCol}>
                    {allCatItems.map((item) => {
                      if ('reviewCount' in item) {
                        // PopularStudioCard
                        const studio = item as typeof fd.popularStudios[0]
                        return (
                          <PopularStudioCardView
                            key={studio.id}
                            item={studio}
                            onClick={() => navigate(`/business/${studio.businessId}`)}
                            isFavorite={isFavorite(studio.businessId || '')}
                            onToggleFavorite={() => toggle(studio.businessId || '')}
                          />
                        )
                      } else {
                        // NearbyBusinessCard — adapt to PopularStudioCard shape
                        const nb = item as typeof fd.nearby[0]
                        const adapted: typeof fd.popularStudios[0] = {
                          id: `nearby-${nb.id}`,
                          name: nb.name,
                          category: nb.category,
                          categoryLabel: nb.categoryLabel,
                          rating: nb.rating,
                          reviewCount: 0,
                          photoUrl: nb.photoUrl,
                          photos: undefined,
                          businessId: nb.businessId,
                        }
                        return (
                          <PopularStudioCardView
                            key={nb.id}
                            item={adapted}
                            onClick={() => navigate(`/business/${nb.businessId}`)}
                            isFavorite={isFavorite(nb.businessId || '')}
                            onToggleFavorite={() => toggle(nb.businessId || '')}
                          />
                        )
                      }
                    })}
                  </div>
                )
              })()}
            </section>
          ) : (
            /* Default home view */
            <>
              {/* Вы посещали — horizontal carousel */}
              <section className={styles.sectionInner}>
                <SectionHeader title="Вы посещали" onMoreClick={() => navigate('/my-bookings')} />
                {effectiveVisitedLoading ? (
                  <div className={styles.skeleton}><Skeleton variant="rect" height={120} /></div>
                ) : hasVisitedData ? (
                  <HScroll snap>
                    {effectiveVisited.map((v) => (
                      <VisitedCard
                        key={v.id}
                        item={v}
                        onClick={() => navigate(`/business/${v.businessId}/master/${v.masterId}`)}
                        onBook={() => navigate(`/business/${v.businessId}/master/${v.masterId}`)}
                        compact
                      />
                    ))}
                  </HScroll>
                ) : (
                  <p className={styles.emptySection}>Вы ещё не посещали мастеров</p>
                )}
              </section>

              {/* Рядом с вами */}
              <section className={styles.sectionInner}>
                <SectionHeader title="Рядом с вами" onMoreClick={() => navigate('/search')} />
                {isLoading || !data ? (
                  <div className={styles.skeleton}><Skeleton variant="rect" height={104} /></div>
                ) : (
                  <HScroll snap>
                    {fd.nearby.map((n) => (
                      <NearbyCard key={n.id} item={n} onClick={() => navigate(`/business/${n.businessId}`)} compact />
                    ))}
                  </HScroll>
                )}
              </section>

              {/* Доступные специалисты */}
              <section className={styles.sectionInner}>
                <SectionHeader title="Доступные специалисты" onMoreClick={() => navigate('/search')} />
                {isLoading || !data ? (
                  <div className={styles.skeleton}><Skeleton variant="rect" height={204} /></div>
                ) : (
                  <HScroll snap autoScroll>
                    {fd.popularMasters.map((m) => (
                      <PopularMasterCardView key={m.id} item={m} onClick={() => navigate(`/business/${m.businessId}/master/${m.masterId}`)} />
                    ))}
                  </HScroll>
                )}
              </section>

              {/* Filter chips — filters everything below */}
              <HomeFilterChipsRow chips={FILTER_CHIPS} activeFilters={activeFilters} onFilterClick={handleFilterClick} />

              {/* Популярные */}
              <section className={styles.sectionInner}>
                <SectionHeader title="Популярные" onMoreClick={() => navigate('/search')} />
                {isLoading || !data ? (
                  <div className={styles.skeleton}><Skeleton variant="rect" height={246} /></div>
                ) : fd.popularStudios.length > 0 ? (
                  <div className={styles.visitedCol}>
                    {fd.popularStudios.map((s) => (
                      <PopularStudioCardView key={s.id} item={s} onClick={() => navigate(`/business/${s.businessId}`)} isFavorite={isFavorite(s.businessId || '')} onToggleFavorite={() => toggle(s.businessId || '')} />
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptySection}>Ничего не найдено по фильтрам</p>
                )}
              </section>
            </>
          )}
        </div>
      </div>
      <CitySelector open={citySelectorOpen} onClose={() => setCitySelectorOpen(false)} />
    </div>
  )
}
