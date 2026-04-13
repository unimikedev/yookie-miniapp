import React from 'react'
import { Business, CATEGORY_LABELS } from '@/lib/api/types'
import { getMockBusinessImage } from '@/lib/utils/mockImages'
import { FavoriteButton } from './FavoriteButton'
import styles from './BusinessCard.module.css'

interface BusinessCardProps {
  business: Business
  onClick?: (business: Business) => void
}

const STAR_SVG = (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
    <path d="M5.37 0C5.9 0 6.31 0.4 6.58 0.93L7.46 2.71C7.48 2.76 7.55 2.84 7.64 2.91C7.74 2.98 7.83 3.02 7.89 3.03L9.49 3.3C10.06 3.39 10.55 3.68 10.7 4.17C10.86 4.66 10.63 5.17 10.21 5.59L8.98 6.84C8.93 6.88 8.87 6.98 8.84 7.1C8.8 7.22 8.8 7.33 8.82 7.4L8.82 7.4L9.17 8.95C9.32 9.59 9.27 10.23 8.81 10.56C8.36 10.9 7.74 10.75 7.17 10.41L5.68 9.52C5.61 9.48 5.51 9.45 5.38 9.45C5.25 9.45 5.14 9.48 5.07 9.52L5.07 9.52L3.58 10.41C3.01 10.75 2.39 10.9 1.94 10.56C1.48 10.23 1.43 9.59 1.58 8.95L1.93 7.4L1.93 7.4C1.95 7.33 1.95 7.22 1.91 7.1C1.88 6.98 1.82 6.88 1.77 6.84L0.53 5.59C0.12 5.17 -0.11 4.66 0.05 4.17C0.2 3.68 0.69 3.39 1.26 3.3L2.86 3.03L2.86 3.03C2.92 3.02 3.01 2.98 3.1 2.91C3.2 2.84 3.26 2.76 3.29 2.71L3.29 2.7L4.17 0.93L4.17 0.93C4.44 0.4 4.85 0 5.37 0Z" fill="#FBBF24"/>
  </svg>
)

export const BusinessCard: React.FC<BusinessCardProps> = ({ business, onClick }) => {
  const mockImage = getMockBusinessImage(business.category, business.id)
  const categoryLabel = CATEGORY_LABELS[business.category] ?? business.category

  return (
    <div className={styles.card} onClick={() => onClick?.(business)}>
      <div className={styles.imageWrap}>
        {mockImage ? (
          <img src={mockImage} alt={business.name} className={styles.image} loading="lazy" />
        ) : (
          <div className={styles.imageFallback} />
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{business.name}</span>
          {business.rating != null && (
            <span className={styles.rating}>
              {STAR_SVG}
              <span>{Number(business.rating).toFixed(1)}</span>
            </span>
          )}
        </div>
        <p className={styles.category}>{categoryLabel}</p>
        <p className={styles.address}>{business.address}</p>
      </div>
      <div
        className={styles.favBtn}
        onClick={(e) => { e.stopPropagation() }}
      >
        <FavoriteButton businessId={business.id} size="sm" />
      </div>
    </div>
  )
}
