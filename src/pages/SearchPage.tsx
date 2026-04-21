import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useHomeData } from '@/hooks/useHomeData'
import { Skeleton, EmptyState } from '@/shared/ui'
import { PopularStudioCardView, PopularMasterCardView } from '@/components/features/home'
import { useFavoritesStore } from '@/stores/favoritesStore'
import { fetchBusinesses } from '@/lib/api/businesses'
import { useCityStore } from '@/stores/cityStore'
import { CATEGORY_LABELS, CategoryEnum } from '@/lib/api/types'
import { getMockBusinessImage, getMockMasterImage } from '@/lib/utils/mockImages'
import { formatMasterName } from '@/lib/utils/name'
import styles from './SearchPage.module.css'

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path fillRule="evenodd" clipRule="evenodd" d="M0 10C0 4.48 4.48 0 10 0C15.52 0 20 4.48 20 10C20 15.52 15.52 20 10 20C4.48 20 0 15.52 0 10ZM10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2Z" fill="#6B7280"/>
    <path opacity="0.4" fillRule="evenodd" clipRule="evenodd" d="M0.29 0.29C0.68-0.1 1.32-0.1 1.71 0.29L6.21 4.79C6.6 5.18 6.6 5.82 6.21 6.21C5.82 6.6 5.18 6.6 4.79 6.21L0.29 1.71C-0.1 1.32-0.1 0.68 0.29 0.29Z" fill="#F9FAFB" transform="translate(14 14)"/>
  </svg>
)

const FilterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M9.78 20V17.83H14.22V20H9.78ZM5.33 14.58V12.42H18.67V14.58H5.33ZM2 9.17V7H22V9.17H2Z" fill="#F9FAFB"/>
  </svg>
)

function buildDayChips(): Array<{ label: string; date: Date }> {
  const chips = []
  const DAY_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']
  for (let i = 0; i < 5; i++) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + i)
    const label = i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : `${DAY_SHORT[d.getDay()]} ${d.getDate()}`
    chips.push({ label, date: d })
  }
  return chips
}

const DAY_CHIPS = buildDayChips()

export default function SearchPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const categoryParam = searchParams.get('category') as string | null
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const { toggle, isFavorite } = useFavoritesStore()
  const { city } = useCityStore()

  const { data, isLoading } = useHomeData()

  // Global search results
  const [searchResults, setSearchResults] = useState<{
    businesses: Array<{ id: string; name: string; category: string; description: string; type: 'business' }>
    masters: Array<{ id: string; name: string; specialization: string; businessId: string; businessName: string; type: 'master' }>
    services: Array<{ id: string; name: string; businessId: string; businessName: string; type: 'service' }>
  } | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)

  const filters = ['Рядом', 'Рейтинг', 'Акции']

  const toggleFilter = (f: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev)
      next.has(f) ? next.delete(f) : next.add(f)
      return next
    })
  }

  const toggleDay = (idx: number) => {
    setSelectedDay(prev => prev === idx ? null : idx)
  }

  // Global search across businesses, masters, services
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(null)
      return
    }

    setSearchLoading(true)
    const controller = new AbortController()

    const performSearch = async () => {
      try {
        // Search businesses
        const bizRes = await fetchBusinesses({ city: city.id, search: query, limit: 50 })
        const businesses = (bizRes.data ?? []).map(b => ({
          id: b.id,
          name: b.name,
          category: b.category,
          description: b.description || '',
          type: 'business' as const,
        }))

        // Search masters and services from home data
        const masters = (data?.popularMasters ?? []).filter(m =>
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.specialization.toLowerCase().includes(query.toLowerCase())
        ).map(m => ({
          id: m.masterId,
          name: m.name,
          specialization: m.specialization,
          businessId: m.businessId,
          businessName: '',
          type: 'master' as const,
        }))

        // Collect all services from nearby and popular studios
        const services: Array<{ id: string; name: string; businessId: string; businessName: string; type: 'service' }> = []

        // Filter results
        const q = query.toLowerCase()
        const filteredBusinesses = businesses.filter(b =>
          b.name.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          (CATEGORY_LABELS[b.category as keyof typeof CATEGORY_LABELS] || '').toLowerCase().includes(q)
        )

        if (!controller.signal.aborted) {
          setSearchResults({
            businesses: filteredBusinesses,
            masters,
            services,
          })
          setSearchLoading(false)
        }
      } catch {
        if (!controller.signal.aborted) {
          setSearchLoading(false)
        }
      }
    }

    performSearch()
    return () => controller.abort()
  }, [query, city.id, data])

  // Filter studios based on search and category
  const studios = data?.popularStudios ?? []
  const nearby = data?.nearby ?? []
  const allItems = [...studios, ...nearby]

  const filtered = allItems.filter(item => {
    const matchesQuery = !query || item.name.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = !categoryParam || item.category === categoryParam
    return matchesQuery && matchesCategory
  })

  // Determine what to show
  const hasSearchResults = query.trim() && searchResults && (searchResults.businesses.length > 0 || searchResults.masters.length > 0 || searchResults.services.length > 0)
  const showDefaultResults = !query.trim() || !searchResults
  const total = hasSearchResults
    ? searchResults!.businesses.length + searchResults!.masters.length + searchResults!.services.length
    : filtered.length

  return (
    <div className={styles.page}>
      <div className={styles.searchHeader}>
        <div className={styles.searchBar}>
          <span className={styles.searchIconWrap}><SearchIcon /></span>
          <input
            className={styles.input}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Найти барбера, мастера..."
            autoFocus
          />
          <button className={styles.filterBtn} onClick={() => {
            const firstActive = activeFilters.values().next().value as string | undefined
            // Toggle sort by rating as default filter action
            toggleFilter('Рейтинг')
          }}><FilterIcon /></button>
        </div>

        <div className={styles.filters}>
          {filters.map(f => (
            <button
              key={f}
              className={`${styles.filterPill} ${activeFilters.has(f) ? styles.filterPillActive : ''}`}
              onClick={() => toggleFilter(f)}
            >
              {f}
            </button>
          ))}
          <div className={styles.filterDivider} />
          {DAY_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              className={`${styles.filterPill} ${styles.filterPillDay} ${selectedDay === idx ? styles.filterPillActive : ''}`}
              onClick={() => toggleDay(idx)}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className={styles.meta}>
          <div>
            <p className={styles.metaCount}>Найдено {total} результата</p>
            <p className={styles.metaQuery}>{query ? `Результаты для «${query}»` : 'Все заведения'}</p>
          </div>
          <button className={styles.mapBtn} onClick={() => navigate('/nearby')}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 13.5L4.5 11.93L1.01 13.28C0.76 13.38 0.53 13.35 0.32 13.19C0.11 13.03 0 12.82 0 12.56V2.06C0 1.9 0.05 1.76 0.14 1.63C0.23 1.51 0.36 1.41 0.53 1.35L4.5 0L9 1.58L12.49 0.23C12.74 0.13 12.97 0.15 13.18 0.31C13.39 0.47 13.5 0.68 13.5 0.94V11.44C13.5 11.6 13.45 11.74 13.36 11.87C13.27 11.99 13.14 12.09 12.98 12.15L9 13.5ZM8.25 11.66V2.89L5.25 1.84V10.61L8.25 11.66ZM9.75 11.66L12 10.91V2.02L9.75 2.89V11.66ZM1.5 11.47L3.75 10.61V1.84L1.5 2.59V11.47Z" fill="#6BCEFF"/></svg>
            <span>На карте</span>
          </button>
        </div>
      </div>

      <div className={styles.results}>
        {isLoading || searchLoading ? (
          [1, 2, 3, 4].map(i => <div key={i} className={styles.skeletonItem}><Skeleton variant="rect" height={246} /></div>)
        ) : hasSearchResults ? (
          <>
            {/* Businesses */}
            {searchResults!.businesses.length > 0 && (
              <>
                <div className={styles.searchSectionTitle}>Салоны</div>
                {searchResults!.businesses.map(biz => {
                  const adapted = {
                    id: biz.id,
                    name: biz.name,
                    category: biz.category as CategoryEnum,
                    categoryLabel: CATEGORY_LABELS[biz.category as keyof typeof CATEGORY_LABELS] || biz.category,
                    rating: 0,
                    reviewCount: 0,
                    photoUrl: getMockBusinessImage(biz.category, biz.id),
                    photos: [] as string[],
                    businessId: biz.id,
                    providerType: 'business' as const,
                  }
                  return (
                    <PopularStudioCardView
                      key={biz.id}
                      item={adapted}
                      onClick={() => navigate(`/business/${biz.id}`)}
                      isFavorite={isFavorite(biz.id)}
                      onToggleFavorite={() => toggle(biz.id)}
                    />
                  )
                })}
              </>
            )}

            {/* Masters */}
            {searchResults!.masters.length > 0 && (
              <>
                <div className={styles.searchSectionTitle}>Мастера</div>
                {searchResults!.masters.map(m => (
                  <div
                    key={m.id}
                    className={styles.masterSearchResult}
                    onClick={() => navigate(`/business/${m.businessId}`)}
                  >
                    <div className={styles.masterSearchAvatar}>
                      <img src={getMockMasterImage(m.id)} alt={m.name} />
                    </div>
                    <div className={styles.masterSearchInfo}>
                      <span className={styles.masterSearchName}>{formatMasterName(m.name)}</span>
                      <span className={styles.masterSearchSpec}>{m.specialization}</span>
                    </div>
                    <svg width="6" height="11" viewBox="0 0 6 11" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd" d="M1.17 10.94L0 10L3.63 5.47L0 0.94L1.17 0L5.55 5.47L1.17 10.94Z" fill="#9CA3AF"/>
                    </svg>
                  </div>
                ))}
              </>
            )}

            {/* Services */}
            {searchResults!.services.length > 0 && (
              <>
                <div className={styles.searchSectionTitle}>Услуги</div>
                {searchResults!.services.map(svc => (
                  <div
                    key={svc.id}
                    className={styles.serviceSearchResult}
                    onClick={() => navigate(`/business/${svc.businessId}`)}
                  >
                    <div className={styles.serviceSearchInfo}>
                      <span className={styles.serviceSearchName}>{svc.name}</span>
                      <span className={styles.serviceSearchBiz}>{svc.businessName}</span>
                    </div>
                    <svg width="6" height="11" viewBox="0 0 6 11" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd" d="M1.17 10.94L0 10L3.63 5.47L0 0.94L1.17 0L5.55 5.47L1.17 10.94Z" fill="#9CA3AF"/>
                    </svg>
                  </div>
                ))}
              </>
            )}
          </>
        ) : showDefaultResults && filtered.length > 0 ? (
          filtered.map(item => {
            // Adapt NearbyBusinessCard to PopularStudioCard shape if needed
            const studioItem = 'reviewCount' in item ? item : {
              ...item,
              reviewCount: 0,
              photos: [] as string[],
            }
            return (
              <PopularStudioCardView
                key={item.id}
                item={studioItem}
                onClick={() => navigate(`/business/${item.businessId}`)}
                isFavorite={isFavorite(item.businessId)}
                onToggleFavorite={() => toggle(item.businessId)}
              />
            )
          })
        ) : (
          <EmptyState title="Ничего не найдено" description="Попробуйте изменить запрос или фильтры" />
        )}
      </div>
    </div>
  )
}
