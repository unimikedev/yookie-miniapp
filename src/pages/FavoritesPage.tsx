import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useFavoritesStore } from '@/stores/favoritesStore'
import { Business, CATEGORY_LABELS } from '@/lib/api/types'
import { fetchBusiness } from '@/lib/api/businesses'
import { getMockBusinessImage } from '@/lib/utils/mockImages'
import { Skeleton } from '@/shared/ui'
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
        try {
          return await fetchBusiness(id)
        } catch {
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
      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Сохраненные студии</h2>
            <p className={styles.sectionCount}>{favoriteIds.size} объект в коллекции</p>
          </div>

          {isLoading ? (
            [1, 2].map(i => (
              <div key={i} className={styles.studioCard}>
                <Skeleton variant="rect" height={140} />
              </div>
            ))
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
                          <span className={styles.reviewCount}>
                            {((business as any).review_count ?? 0) > 0
                              ? `(${(business as any).review_count} отзывов)`
                              : '(нет отзывов)'}
                          </span>
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
