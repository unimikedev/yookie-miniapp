import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useFavoritesStore } from '@/stores/favoritesStore'
import { Business, CATEGORY_LABELS } from '@/lib/api/types'
import { fetchBusiness } from '@/lib/api/businesses'
import { getMockBusinessImage } from '@/lib/utils/mockImages'
import { MOCK_BUSINESSES } from '@/lib/mockBusinesses'
import { FavoriteButton } from '@/components/features'
import styles from './FavoritesPage.module.css'

const StarIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.37 0C5.9 0 6.31 0.4 6.58 0.93L7.46 2.71C7.48 2.76 7.55 2.84 7.64 2.91C7.74 2.98 7.83 3.02 7.89 3.03L9.49 3.3C10.06 3.39 10.55 3.68 10.7 4.17C10.86 4.66 10.63 5.17 10.21 5.59L8.98 6.84C8.93 6.88 8.87 6.98 8.84 7.1C8.8 7.22 8.8 7.33 8.82 7.4L9.17 8.95C9.32 9.59 9.27 10.23 8.81 10.56C8.36 10.9 7.74 10.75 7.17 10.41L5.68 9.52C5.61 9.48 5.51 9.45 5.38 9.45C5.25 9.45 5.14 9.48 5.07 9.52L3.58 10.41C3.01 10.75 2.39 10.9 1.94 10.56C1.48 10.23 1.43 9.59 1.58 8.95L1.93 7.4C1.95 7.33 1.95 7.22 1.91 7.1C1.88 6.98 1.82 6.88 1.77 6.84L0.53 5.59C0.12 5.17 -0.11 4.66 0.05 4.17C0.2 3.68 0.69 3.39 1.26 3.3L2.86 3.03C2.92 3.02 3.01 2.98 3.1 2.91C3.2 2.84 3.26 2.76 3.29 2.71L4.17 0.93C4.44 0.4 4.85 0 5.37 0Z" fill="#FBBF24"/></svg>
)

function formatCategory(cat: string): string {
  return CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat
}

export default function FavoritesPage() {
  const navigate = useNavigate()
  const { favoriteIds } = useFavoritesStore()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const ids = Array.from(favoriteIds)

  useEffect(() => {
    if (ids.length === 0) {
      setBusinesses([])
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    Promise.allSettled(
      ids.map(async (id) => {
        // Try real API first
        try {
          const biz = await fetchBusiness(id)
          return biz
        } catch {
          // Fall back to mock data
          const mock = MOCK_BUSINESSES.find(b => b.id === id)
          if (mock) return mock
          return null
        }
      })
    ).then((results) => {
      if (cancelled) return
      const loaded: Business[] = []
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          loaded.push(result.value)
        }
      })
      setBusinesses(loaded)
      setIsLoading(false)
    })

    return () => { cancelled = true }
  }, [ids.join(',')])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.83 9L9.43 14.6L8 16L0 8L8 0L9.43 1.4L3.83 7H16V9H3.83Z" fill="currentColor"/></svg>
          </button>
          <div className={styles.headerTitleRow}>
            <svg width="22" height="20" viewBox="0 0 22 20" fill="none"><path d="M2.89 1.11C5.88-0.72 8.55 0 10.17 1.22C10.43 1.42 10.61 1.55 10.75 1.65C10.89 1.55 11.07 1.42 11.33 1.22C12.95 0 15.62-0.72 18.6 1.11C20.67 2.37 21.83 5.01 21.42 8.05C21.01 11.09 19.04 14.54 14.86 17.64C13.4 18.71 12.34 19.5 10.75 19.5C9.16 19.5 8.09 18.71 6.64 17.64C2.46 14.54 0.49 11.09 0.08 8.05C-0.33 5.01 0.83 2.37 2.89 1.11Z" fill="currentColor"/></svg>
            <span className={styles.headerTitle}>Избранные</span>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Сохраненные студии</h2>
            <p className={styles.sectionCount}>{favoriteIds.size} объект в коллекции</p>
          </div>

          {isLoading ? (
            [1, 2].map(i => <div key={i} className={styles.skeletonCard}><div className={styles.skeletonPlaceholder} /></div>)
          ) : favoriteIds.size === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>Нет сохранённых студий</p>
              <p className={styles.emptySub}>Добавляйте понравившиеся в избранное</p>
              <button className={styles.ctaBtn} onClick={() => navigate('/')}>Найти студии</button>
            </div>
          ) : (
            businesses.map(business => {
              const img = getMockBusinessImage(business.category, business.id)
              return (
                <div key={business.id} className={styles.studioCard}>
                  <div className={styles.studioImageWrap}>
                    {img ? <img src={img} alt={business.name} className={styles.studioImage} /> : <div className={styles.studioImageFallback} />}
                    <FavoriteButton businessId={business.id} size="sm" />
                  </div>
                  <div className={styles.studioBody}>
                    <div className={styles.studioNameRow}>
                      <div>
                        <h3 className={styles.studioName}>{business.name}</h3>
                        <div className={styles.ratingRow}>
                          <StarIcon />
                          <span className={styles.ratingNum}>{business.rating?.toFixed(1) ?? '—'}</span>
                          <span className={styles.reviewCount}>(отзывы)</span>
                        </div>
                      </div>
                      <div className={styles.categoryBadge}><span>{formatCategory(business.category)}</span></div>
                    </div>
                    <p className={styles.description}>{business.description}</p>
                    <button className={styles.ctaBtn} onClick={() => navigate(`/business/${business.id}`)}>
                      К специалистам
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </section>
      </div>
    </div>
  )
}
