import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { useBusiness } from '@/hooks/useBusiness';
import { LoadingState } from '@/components/ui/LoadingState';
import styles from './MerchantPreviewPage.module.css';

/**
 * #18 Preview Mode - Как видят клиенты профиль мерчанта
 * Позволяет мерчанту увидеть свой профиль глазами клиента перед публикацией
 */
export default function MerchantPreviewPage() {
  const navigate = useNavigate();
  const { merchantId } = useMerchantStore();
  const { business, loading, error } = useBusiness(merchantId!);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  if (!merchantId) {
    return <LoadingState variant="empty" title="Бизнес не найден" message="Сначала создайте бизнес" />;
  }

  if (loading) {
    return <LoadingState variant="skeleton" />;
  }

  if (error || !business) {
    return <LoadingState variant="error" message={error || 'Ошибка загрузки'} onRetry={() => window.location.reload()} />;
  }

  const photos = business.photo_url ? [business.photo_url] : [];

  return (
    <div className={styles.preview}>
      {/* Header with close button */}
      <div className={styles.previewHeader}>
        <button className={styles.closeBtn} onClick={() => navigate('/pro/settings')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span className={styles.previewTitle}>Предпросмотр</span>
        <div className={styles.placeholder} />
      </div>

      {/* Cover photo */}
      {photos.length > 0 && (
        <div className={styles.coverPhoto}>
          <img src={photos[activePhotoIndex]} alt={business.name} />
          {photos.length > 1 && (
            <div className={styles.photoPager}>
              {photos.map((_, idx) => (
                <button
                  key={idx}
                  className={`${styles.pagerDot} ${idx === activePhotoIndex ? styles.active : ''}`}
                  onClick={() => setActivePhotoIndex(idx)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Business info */}
      <div className={styles.businessInfo}>
        <h1 className={styles.businessName}>{business.name}</h1>
        
        {business.category && (
          <div className={styles.categoryBadge}>{business.category}</div>
        )}

        {business.rating && (
          <div className={styles.rating}>
            <span className={styles.star}>⭐</span>
            <span className={styles.ratingValue}>{business.rating.toFixed(1)}</span>
            {business.review_count && (
              <span className={styles.reviewCount}> ({business.review_count})</span>
            )}
          </div>
        )}

        {business.address && (
          <div className={styles.address}>
            <span className={styles.icon}>📍</span>
            {business.address}
          </div>
        )}

        {business.description && (
          <div className={styles.description}>
            <h3>О заведении</h3>
            <p>{business.description}</p>
          </div>
        )}

        {/* Contact info */}
        <div className={styles.contacts}>
          <h3>Контакты</h3>
          {business.phone && (
            <a href={`tel:${business.phone}`} className={styles.contactLink}>
              📞 {business.phone}
            </a>
          )}
          {business.instagram && (
            <a
              href={`https://instagram.com/${business.instagram.replace(/^@/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.contactLink}
            >
              📷 @{business.instagram}
            </a>
          )}
          {business.telegram_username && (
            <a
              href={`https://t.me/${business.telegram_username.replace(/^@/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.contactLink}
            >
              ✈️ @{business.telegram_username}
            </a>
          )}
        </div>

        {/* Warning banner */}
        <div className={styles.warningBanner}>
          <span className={styles.warningIcon}>⚠️</span>
          <div className={styles.warningText}>
            <strong>Это предпросмотр</strong>
            <p>Ваш профиль еще не опубликован. Заполните все разделы в настройках.</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className={styles.actionButtons}>
        <button
          className={styles.editBtn}
          onClick={() => navigate('/pro/settings')}
        >
          Редактировать
        </button>
        <button
          className={styles.publishBtn}
          onClick={() => {
            // TODO: Trigger publish action via API
            alert('Функция публикации будет доступна после проверки профиля');
          }}
        >
          Опубликовать
        </button>
      </div>
    </div>
  );
}
