/**
 * HomePage — Figma "Главная" (node 184:6540).
 * Updated: unified card designs, header spacing, real business hours
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useHomeData } from '@/hooks/useHomeData'
import { useVisitedMasters } from '@/hooks/useVisitedMasters'
import { useFavoritesStore } from '@/stores/favoritesStore'
import { useCityStore } from '@/stores/cityStore'
import { useAuthStore } from '@/stores/authStore'
import { Skeleton } from '@/shared/ui'
import { useOfflineMode } from '@/hooks/useOfflineMode'
import CitySelector from '@/components/features/CitySelector'
import {
  SectionHeader,
  HomeCategoryChip,
  MasterCard,
  NearbyCard,
  PopularStudioCardView,
  HomeFilterChipsRow,
  HScroll,
} from '@/components/features/home'
import type { CategoryEnum, Business } from '@/lib/api/types'
import { CATEGORY_LABELS } from '@/lib/api/types'
import type { HomeFilterChip, PopularStudioCard } from '@/lib/api/home'
import { CATEGORIES, CATEGORY_ICONS } from '@/shared/constants'
import { fetchBusinesses } from '@/lib/api/businesses'
import { getMockBusinessImage } from '@/lib/utils/mockImages'
import styles from './HomePage.module.css'

interface SearchResultItem {
  type: 'business' | 'master' | 'category'
  id: string
  name: string
  meta: string
  iconSrc?: string
  businessId?: string
  masterId?: string
}

type FeedFilterKey = 'new_places' | 'popular' | 'top_rated'
const FEED_CHIPS = new Set<string>(['new_places', 'popular', 'top_rated'])
const FEED_LIMIT = 10
const FEED_SORTS: Record<FeedFilterKey, 'popular' | 'rating' | undefined> = {
  new_places: undefined,
  popular: 'popular',
  top_rated: 'rating',
}

function toFeedCard(b: Business): PopularStudioCard {
  const ab = b as any
  const primaryPhoto = b.photo_url ?? getMockBusinessImage(b.category, b.id)
  const seen = new Set<string>()
  const allPhotos: string[] = []
  for (const p of [primaryPhoto, ...(b.photo_urls ?? [])]) {
    if (p && !seen.has(p)) { seen.add(p); allPhotos.push(p) }
  }
  return {
    id: `feed-${b.id}`,
    providerType: b.provider_type,
    name: b.name,
    category: b.category,
    categoryLabel: CATEGORY_LABELS[b.category] ?? b.category,
    rating: ab.rating ?? 0,
    reviewCount: ab.review_count ?? 0,
    photoUrl: allPhotos[0] ?? null,
    photos: allPhotos.length > 1 ? allPhotos.slice(1) : undefined,
    businessId: b.id,
    priceFrom: ab.min_price ?? 0,
  }
}

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="9" cy="9" r="6" stroke="#6B7280" strokeWidth="2" />
    <path d="M13.5 13.5L18 18" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const ChevronRight = () => (
  <svg width="6" height="12" viewBox="0 0 6 12" fill="none">
    <path d="M1 1L5 6L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const HeartIconLarge = () => (
  <svg width="22" height="20" viewBox="0 0 20 18" fill="none">
    <path
      d="M10 17.5C9.7 17.5 9.4 17.4 9.14 17.2L1.5 10.5C0.53 9.58 0 8.33 0 7C0 4.24 2.24 2 5 2C6.9 2 8.57 3.11 9.4 4.7C9.54 4.88 9.76 5 10 5C10.24 5 10.46 4.88 10.6 4.7C11.43 3.11 13.1 2 15 2C17.76 2 20 4.24 20 7C20 8.33 19.47 9.58 18.5 10.5L10.86 17.2C10.6 17.4 10.3 17.5 10 17.5Z"
      fill="rgba(255,255,255,0.9)"
    />
  </svg>
)

/**
 * TypingPlaceholder — animated placeholder that types different service keywords
 */
function TypingPlaceholder() {
  const { t } = useTranslation()
  const words = t('home.typingWords', { returnObjects: true }) as string[]
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentWord = words[currentWordIndex] ?? ''
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
          setCurrentWordIndex((currentWordIndex + 1) % words.length)
        }
      }
    }, isDeleting ? 80 : 120)
    return () => clearTimeout(timeout)
  }, [currentCharIndex, currentWordIndex, isDeleting, words])

  const currentWord = words[currentWordIndex] ?? ''
  const typedText = currentWord.substring(0, currentCharIndex)

  return (
    <>
      {typedText}
      <span className={styles.typingCursor} />
    </>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data, isLoading, error } = useHomeData()
  const { visited: apiVisited, isLoading: visitedLoading } = useVisitedMasters()
  const { toggle, isFavorite } = useFavoritesStore()
  const { city, district } = useCityStore()
  const authStore = useAuthStore()
  const { isOnline } = useOfflineMode()

  // Handle offline state
  if (!isOnline && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="mb-4 text-4xl">📡</div>
        <h3 className="text-lg font-bold mb-2">{t('offline.title')}</h3>
        <p className="text-sm text-gray-500">{t('offline.description')}</p>
      </div>
    )
  }

  const FILTER_CHIPS: HomeFilterChip[] = [
    { key: 'sort', label: '', icon: 'arrows' },
    { key: 'new_places', label: t('home.filterNew') },
    { key: 'popular', label: t('home.filterPopular') },
    { key: 'top_rated', label: t('home.filterTopRated') },
    { key: 'promo', label: t('home.filterPromo') },
    { key: 'nearby', label: t('home.filterNearby') },
    { key: 'available', label: t('home.filterAvailable') },
  ]

  const FEED_TITLES: Record<FeedFilterKey, string> = {
    new_places: t('home.filterNew'),
    popular: t('home.filterPopular'),
    top_rated: t('home.filterTopRated'),
  }

  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['new_places']))
  const [selectedCategory, setSelectedCategory] = useState<CategoryEnum | null>(null)
  const [citySelectorOpen, setCitySelectorOpen] = useState(false)

  const marqueeRef = useRef<HTMLDivElement>(null)
  const marqueeRafRef = useRef<number | null>(null)
  const marqueePausedRef = useRef(false)

  const handleMarqueeTouchStart = () => { marqueePausedRef.current = true }
  const handleMarqueeTouchEnd = () => { setTimeout(() => { marqueePausedRef.current = false }, 1500) }

  useEffect(() => {
    const el = marqueeRef.current
    if (!el) return
    const tick = () => {
      if (!marqueePausedRef.current) {
        el.scrollLeft += 0.3
        const half = el.scrollWidth / 2
        if (half > 0 && el.scrollLeft >= half) el.scrollLeft -= half
      }
      marqueeRafRef.current = requestAnimationFrame(tick)
    }
    marqueeRafRef.current = requestAnimationFrame(tick)
    return () => { if (marqueeRafRef.current) cancelAnimationFrame(marqueeRafRef.current) }
  }, [])

  // Infinite feed state
  const [feedFilter, setFeedFilter] = useState<FeedFilterKey>('new_places')
  const [feedItems, setFeedItems] = useState<PopularStudioCard[]>([])
  const [feedOffset, setFeedOffset] = useState(0)
  const [feedHasMore, setFeedHasMore] = useState(true)
  const [feedLoading, setFeedLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  // Mutable ref so IntersectionObserver callback always sees latest state
  const loadMoreFeedRef = useRef<() => void>(() => {})

  // ── Inline search ──
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced search
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    setSearchLoading(true)
    const q = query.toLowerCase().trim()
    const results: SearchResultItem[] = []

    try {
      // 1. Search businesses
      const bizRes = await fetchBusinesses({ city: city.id, search: query, limit: 8 })
      for (const b of (bizRes.data ?? [])) {
        if (
          b.name.toLowerCase().includes(q) ||
          (b.description ?? '').toLowerCase().includes(q) ||
          (b.category ?? '').toLowerCase().includes(q)
        ) {
          results.push({
            type: 'business',
            id: b.id,
            name: b.name,
            meta: t(`categories.${b.category as CategoryEnum}`) || b.category || '',
            iconSrc: CATEGORY_ICONS[b.category as keyof typeof CATEGORY_ICONS] || '/categories/cosmetology.png',
            businessId: b.id,
          })
        }
      }
    } catch { /* ignore */ }

    // 2. Search masters from home data
    const masters = data?.popularMasters ?? []
    for (const m of masters) {
      if (
        m.name.toLowerCase().includes(q) ||
        m.specialization.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'master',
          id: `master-${m.masterId}`,
          name: m.name,
          meta: m.specialization,
          iconSrc: '/categories/cosmetology.png',
          businessId: m.businessId,
          masterId: m.masterId,
        })
      }
    }

    // 3. Search categories by label
    for (const cat of CATEGORIES) {
      const catLabel = t(`categories.${cat.key}`)
      if (catLabel.toLowerCase().includes(q)) {
        results.unshift({
          type: 'category',
          id: `cat-${cat.key}`,
          name: catLabel,
          meta: t('categories.category'),
          iconSrc: cat.icon,
        })
      }
    }

    setSearchResults(results.slice(0, 10))
    setSearchLoading(false)
  }, [city.id, data])

  // Debounce: search 300ms after last keystroke
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(() => {
      performSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, performSearch])

  const handleSearchSelect = (item: SearchResultItem) => {
    if (item.type === 'category') {
      setSelectedCategory(item.id.replace('cat-', '') as CategoryEnum)
      setSearchQuery('')
      setSearchResults([])
      inputRef.current?.blur()
      return
    }
    if (item.type === 'business') {
      navigate(`/business/${item.businessId}`)
      return
    }
    if (item.type === 'master' && item.businessId) {
      navigate(`/business/${item.businessId}`, {
        state: { fromDeepLink: true, highlightMaster: item.masterId },
      })
      return
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  // Close dropdown on outside click
  const showDropdown = searchFocused && searchQuery.trim().length > 0

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
          providerType: 'business' as const,
          lastVisitDate: vb.lastVisitAt
            ? new Date(vb.lastVisitAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
            : '',
        }))
      )
    : null

  // Only show real booking history — never fall back to mock/seeded businesses
  const effectiveVisited = visitedCards
  const effectiveVisitedLoading = visitedLoading

  const handleFilterClick = (key: string) => {
    if (FEED_CHIPS.has(key)) {
      // Radio: clicking active feed chip resets to 'new_places'
      const next = (key === feedFilter ? 'new_places' : key) as FeedFilterKey
      setFeedFilter(next)
      setActiveFilters(prev => {
        const updated = new Set(prev)
        FEED_CHIPS.forEach(k => updated.delete(k))
        updated.add(next)
        return updated
      })
    } else {
      setActiveFilters(prev => {
        const next = new Set(prev)
        next.has(key) ? next.delete(key) : next.add(key)
        return next
      })
    }
  }

  const handleCategoryClick = (catKey: CategoryEnum) => {
    setSelectedCategory(prev => prev === catKey ? null : catKey)
  }

  // ── Feed: reset + load first page when filter or city changes ──
  useEffect(() => {
    let cancelled = false
    setFeedItems([])
    setFeedOffset(0)
    setFeedHasMore(true)
    setFeedLoading(true)
    ;(async () => {
      try {
        const res = await fetchBusinesses({ city: city.id, limit: FEED_LIMIT, offset: 0, sort: FEED_SORTS[feedFilter] })
        if (cancelled) return
        let raw = res.data ?? []
        if (district) {
          const dKey = district.name.replace(/ский$/, '').toLowerCase()
          raw = [
            ...raw.filter(b => (b.address ?? '').toLowerCase().includes(dKey)),
            ...raw.filter(b => !(b.address ?? '').toLowerCase().includes(dKey)),
          ]
        }
        const items = raw.map(toFeedCard)
        setFeedItems(items)
        setFeedOffset(items.length)
        setFeedHasMore(items.length >= FEED_LIMIT)
      } catch {
        if (!cancelled) setFeedHasMore(false)
      } finally {
        if (!cancelled) setFeedLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [feedFilter, city.id, district?.id])

  // ── Feed: update mutable ref so IntersectionObserver always gets fresh state ──
  loadMoreFeedRef.current = () => {
    if (feedLoading || !feedHasMore) return
    ;(async () => {
      setFeedLoading(true)
      try {
        const res = await fetchBusinesses({ city: city.id, limit: FEED_LIMIT, offset: feedOffset, sort: FEED_SORTS[feedFilter] })
        const items = (res.data ?? []).map(toFeedCard)
        setFeedItems(prev => [...prev, ...items])
        setFeedOffset(prev => prev + items.length)
        setFeedHasMore(items.length >= FEED_LIMIT)
      } catch {
        setFeedHasMore(false)
      } finally {
        setFeedLoading(false)
      }
    })()
  }

  // ── Feed: IntersectionObserver — set up once, uses ref ──
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMoreFeedRef.current() },
      { rootMargin: '300px' }
    )
    obs.observe(sentinel)
    return () => obs.disconnect()
  }, [])

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

  const catResults = searchResults.filter(r => r.type === 'category')
  const bizResults = searchResults.filter(r => r.type === 'business')
  const masterResults = searchResults.filter(r => r.type === 'master')

  const renderSearchItem = (item: SearchResultItem) => (
    <button
      key={item.id}
      className={styles.searchResultItem}
      onMouseDown={(e) => { e.preventDefault(); handleSearchSelect(item) }}
    >
      <span className={styles.searchResultIcon}>
        <img src={item.iconSrc} alt="" className={styles.searchResultImage} />
      </span>
      <div className={styles.searchResultInfo}>
        <span className={styles.searchResultName}>{item.name}</span>
        <span className={styles.searchResultMeta}>{item.meta}</span>
      </div>
      <span className={styles.searchResultArrow}><ChevronRight /></span>
    </button>
  )

  if (!filteredData && !effectiveVisitedLoading) {
    return <div className={styles.page}><p>Loading...</p></div>
  }

  const fd = filteredData!

  return (
    <div className={styles.page}>
      {/* Gradient block — scrolls normally with page, no sticky */}
      <div className={styles.gradientBlock}>
        <div className={styles.safeAreaSpacer} />
        <header className={styles.blueHeader}>
          <div className={styles.logoBlock}>
            <img src="/logo.svg" alt="Yookie" className={`${styles.logoImage} ${styles.logoWhite}`} />
            <span className={`${styles.logoSub} ${styles.logoSubWhite}`}>{t('home.subtitle')}</span>
          </div>
          <button className={styles.headerBtnBlue} onClick={() => navigate('/favorites')} aria-label="Избранное">
            <HeartIconLarge />
          </button>
        </header>
      </div>

      {/* White card — overlaps gradient, contains ONLY sticky searchbar */}
      <div className={styles.mainCard}>
        {/* Sticky zone: only the searchbar row, no spacer inside */}
        <div className={styles.searchSticky}>
          <div className={styles.searchBox}>
            <form className={styles.searchInputWrap} onSubmit={handleSearchSubmit}>
              <span className={styles.searchIcon}><SearchIcon /></span>
              <div className={styles.searchInputContainer}>
                <input
                  ref={inputRef}
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  placeholder=""
                  autoComplete="off"
                />
                {!searchQuery && !searchFocused && (
                  <div className={styles.searchPlaceholderOverlay}>
                    <span className={styles.searchPlaceholderStatic}>{t('home.searchPlaceholder')}</span>
                    <span className={styles.searchPlaceholderTyped}><TypingPlaceholder /></span>
                  </div>
                )}
              </div>
              <button
                className={styles.cityBadgeInside}
                type="button"
                onClick={(e) => { e.stopPropagation(); setCitySelectorOpen(true); }}
                aria-label="Смена города"
              >
                <span>{district ? t(`districts.${district.id}`) : t(`cities.${city.id}`)}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>

            {/* Search dropdown */}
            {showDropdown && (
              <div className={styles.searchDropdown}>
                {searchLoading ? (
                  <div className={styles.searchEmpty}>
                    <Skeleton variant="rect" height={48} />
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    {catResults.length > 0 && <><div className={styles.searchDropdownHeader}>{t('home.searchCategories')}</div>{catResults.map(renderSearchItem)}</>}
                    {bizResults.length > 0 && <><div className={styles.searchDropdownHeader}>{t('home.searchBusinesses')}</div>{bizResults.map(renderSearchItem)}</>}
                    {masterResults.length > 0 && <><div className={styles.searchDropdownHeader}>{t('home.searchMasters')}</div>{masterResults.map(renderSearchItem)}</>}
                  </>
                ) : (
                  <div className={styles.searchEmpty}>{t('home.noResults')}</div>
                )}
              </div>
            )}
          </div>
        </div>{/* end searchSticky */}

        {/* Category chips — RAF auto-scroll + native swipe */}
        <div
          ref={marqueeRef}
          className={styles.catMarqueeWrap}
          onTouchStart={handleMarqueeTouchStart}
          onTouchEnd={handleMarqueeTouchEnd}
        >
          {[...CATEGORIES, ...CATEGORIES].map((cat, idx) => (
            <HomeCategoryChip
              key={`${cat.key}-${idx}`}
              label={t(`categories.${cat.key}`)}
              iconSrc={cat.icon}
              onClick={() => handleCategoryClick(cat.key)}
              active={selectedCategory === cat.key}
            />
          ))}
        </div>

        {/* Sections */}
        <div className={styles.sections}>
          {selectedCategory ? (
            /* Category-filtered view: show all matching businesses in a vertical grid */
            <section className={styles.sectionInner}>
              <SectionHeader
                title={selectedCategory ? t(`categories.${selectedCategory}`) : ''}
                onMoreClick={() => setSelectedCategory(null)}
                moreLabel={t('home.resetFilter')}
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
                  return <p className={styles.emptySection}>{t('home.noResults')}</p>
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
                          providerType: nb.providerType ?? 'business',
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
              {hasVisitedData && (
                <section className={styles.sectionInner}>
                  <SectionHeader title={t('home.sectionVisited')} onMoreClick={() => navigate('/my-bookings')} />
                  {effectiveVisitedLoading ? (
                    <div className={styles.skeleton}><Skeleton variant="rect" height={120} /></div>
                  ) : (
                    <HScroll snap>
                      {effectiveVisited.map((v) => (
                        <MasterCard
                          key={v.id}
                          item={v}
                          onClick={() => navigate(`/business/${v.businessId}`, {
                            state: { fromDeepLink: true, highlightMaster: v.masterId },
                          })}
                          nearbyStyle
                        />
                      ))}
                    </HScroll>
                  )}
                </section>
              )}

              {/* Рядом с вами */}
              <section className={styles.sectionInner}>
                <SectionHeader title={t('home.sectionNearby')} onMoreClick={() => navigate('/search')} />
                {isLoading || !data ? (
                  <div className={styles.skeleton}><Skeleton variant="rect" height={104} /></div>
                ) : (
                  <HScroll snap className="contentReveal">
                    {fd.nearby.map((n) => (
                      <NearbyCard key={n.id} item={n} onClick={() => navigate(`/business/${n.businessId}`)} homeVertical />
                    ))}
                  </HScroll>
                )}
              </section>

              {/* Доступные специалисты — uses unified MasterCard */}
              <section className={styles.sectionInner}>
                <SectionHeader title={t('home.sectionMasters')} onMoreClick={() => navigate('/search')} />
                {isLoading || !data ? (
                  <div className={styles.skeleton}><Skeleton variant="rect" height={120} /></div>
                ) : (
                  <HScroll snap autoScroll className="contentReveal">
                    {fd.popularMasters.map((m) => (
                      <MasterCard key={m.id} item={m} onClick={() => navigate(`/business/${m.businessId}`, {
                        state: { fromDeepLink: true, highlightMaster: m.masterId },
                      })} nearbyStyle />
                    ))}
                  </HScroll>
                )}
              </section>

              {/* Filter chips — drives the feed section below */}
              <HomeFilterChipsRow chips={FILTER_CHIPS} activeFilters={activeFilters} onFilterClick={handleFilterClick} />

              {/* Dynamic feed — title and content driven by active filter */}
              <section className={styles.sectionInner}>
                <SectionHeader title={FEED_TITLES[feedFilter]} onMoreClick={() => navigate('/search')} />
                <div className={`${styles.visitedCol} contentReveal`}>
                  {feedItems.map((s) => (
                    <PopularStudioCardView
                      key={s.id}
                      item={s}
                      onClick={() => navigate(`/business/${s.businessId}`)}
                      isFavorite={isFavorite(s.businessId || '')}
                      onToggleFavorite={() => toggle(s.businessId || '')}
                    />
                  ))}
                  {feedItems.length === 0 && !feedLoading && (
                    <p className={styles.emptySection}>{t('home.noBusinesses')}</p>
                  )}
                  {feedLoading && (
                    <div className={styles.skeleton}><Skeleton variant="rect" height={120} /></div>
                  )}
                </div>
                {/* Sentinel — triggers loading next page */}
                <div ref={sentinelRef} style={{ height: 1 }} />
              </section>
            </>
          )}
        </div>
      </div>{/* end mainCard */}
      <CitySelector open={citySelectorOpen} onClose={() => setCitySelectorOpen(false)} />
    </div>
  )
}
