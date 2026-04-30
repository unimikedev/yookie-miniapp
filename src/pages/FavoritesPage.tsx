import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useFavoritesStore } from '@/stores/favoritesStore'
import type { Business } from '@/lib/api/types'
import type { PopularStudioCard } from '@/lib/api/home'
import { fetchBusiness } from '@/lib/api/businesses'
import { Skeleton } from '@/shared/ui'
import { PopularStudioCardView } from '@/components/features/home/HomeCards'
import styles from './FavoritesPage.module.css'

function toStudioCard(b: Business): PopularStudioCard {
  const photos = (b as any).photo_urls as string[] | undefined
  return {
    id: b.id,
    businessId: b.id,
    providerType: b.provider_type,
    name: b.name,
    category: b.category,
    categoryLabel: b.category,
    rating: b.rating ?? 0,
    reviewCount: (b as any).review_count ?? 0,
    photoUrl: b.photo_url ?? null,
    photos: photos && photos.length > 1 ? photos.slice(1) : undefined,
  }
}

export default function FavoritesPage() {
  const navigate = useNavigate()
  const { favoriteIds, toggle, isFavorite } = useFavoritesStore()
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
        try { return await fetchBusiness(id) } catch { return null }
      })
    ).then((results) => {
      if (cancelled) return
      const loaded: Business[] = []
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) loaded.push(result.value)
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
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonPlaceholder} />
              </div>
            ))
          ) : favoriteIds.size === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>Нет сохранённых студий</p>
              <p className={styles.emptySub}>Добавляйте понравившиеся в избранное</p>
              <button className={styles.ctaBtn} onClick={() => navigate('/')}>Найти студии</button>
            </div>
          ) : (
            businesses.map(business => (
              <div key={business.id} className={styles.cardWrap}>
                <PopularStudioCardView
                  item={toStudioCard(business)}
                  onClick={() => navigate(`/business/${business.id}`)}
                  isFavorite={isFavorite(business.id)}
                  onToggleFavorite={() => toggle(business.id)}
                />
                <button
                  className={styles.ctaBtn}
                  onClick={() => navigate(`/business/${business.id}`)}
                >
                  Записаться
                </button>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  )
}
