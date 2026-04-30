import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { patchBusiness } from '@/pro/api';
import { useBusiness } from '@/hooks/useBusiness';
import { LoadingState } from '@/components/ui/LoadingState';
import { useBusinessExit } from '@/pro/hooks/useBusinessExit';
import styles from './MerchantPreviewPage.module.css';

export default function MerchantPreviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { merchantId, role } = useMerchantStore();
  const { business, isLoading, error } = useBusiness(merchantId!);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [localPublished, setLocalPublished] = useState(false);
  const { leaveWithoutResigning, resignAndLeave, logout, loading: exitLoading, error: exitError } = useBusinessExit();

  const isPublished = localPublished || (business?.is_active ?? false);

  useEffect(() => {
    if (business?.is_active) setLocalPublished(true);
  }, [business?.is_active]);

  const handlePublish = async () => {
    if (!merchantId || isPublished) return;
    setPublishing(true);
    setPublishError(null);
    try {
      await patchBusiness(merchantId, { is_active: true });
      setLocalPublished(true);
    } catch {
      setPublishError('Не удалось опубликовать. Попробуйте ещё раз.');
    } finally {
      setPublishing(false);
    }
  };

  const fromWizard = searchParams.get('from') === 'wizard';

  if (!merchantId) {
    return <LoadingState emptyTitle="Бизнес не найден" emptyDescription="Сначала создайте бизнес" hasData={false} />;
  }

  if (isLoading) {
    return <LoadingState variant="skeleton" />;
  }

  if (error || !business) {
    return <LoadingState emptyTitle="Ошибка загрузки" emptyDescription={error?.message ?? 'Попробуйте позже'} hasData={false} />;
  }

  const photos = business.photo_url ? [business.photo_url] : [];

  return (
    <div className={styles.preview}>
      {/* Header with close button */}
      <div className={styles.previewHeader}>
        <button className={styles.closeBtn} onClick={() => navigate(fromWizard ? '/pro/settings' : -1 as any)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span className={styles.previewTitle}>Как видят клиенты</span>
        <button
          className={styles.viewRealBtn}
          onClick={() => navigate(`/business/${merchantId}`)}
          title="Открыть страницу клиента"
        >
          ↗
        </button>
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

        {/* Status banner */}
        {isPublished ? (
          <div className={styles.publishedBanner}>
            <span>✅</span>
            <div className={styles.warningText}>
              <strong>Профиль опубликован</strong>
              <p>Клиенты могут найти и записаться к вам.</p>
            </div>
          </div>
        ) : (
          <div className={styles.warningBanner}>
            <span className={styles.warningIcon}>⚠️</span>
            <div className={styles.warningText}>
              <strong>Профиль не опубликован</strong>
              <p>Клиенты пока не видят ваш профиль. Опубликуйте, когда будете готовы.</p>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className={styles.actionButtons}>
        <button
          className={styles.editBtn}
          onClick={() => navigate('/pro/settings')}
        >
          Редактировать
        </button>
        {isPublished ? (
          <button className={styles.publishedBtn} disabled>
            ✓ Опубликовано
          </button>
        ) : (
          <button
            className={styles.publishBtn}
            disabled={publishing}
            onClick={handlePublish}
          >
            {publishing ? 'Публикация…' : 'Опубликовать'}
          </button>
        )}
      </div>
      {publishError && (
        <p style={{ color: 'var(--color-error)', textAlign: 'center', fontSize: 13, padding: '0 16px 16px' }}>
          {publishError}
        </p>
      )}

      {role === 'staff' && (
        <div className={styles.accountSection}>
          {exitError && <p className={styles.accountError}>{exitError}</p>}
          <button
            className={styles.leaveBtn}
            onClick={() => merchantId && leaveWithoutResigning(merchantId)}
            disabled={exitLoading}
          >
            Выйти из бизнеса
            <span className={styles.leaveBtnHint}>Профиль мастера сохранится</span>
          </button>
          <button
            className={styles.resignBtn}
            onClick={() => merchantId && resignAndLeave(merchantId)}
            disabled={exitLoading}
          >
            Уволиться
            <span className={styles.leaveBtnHint}>Профиль и записи будут удалены</span>
          </button>
          <button
            className={styles.logoutBtn}
            onClick={logout}
            disabled={exitLoading}
          >
            Выйти из аккаунта
          </button>
        </div>
      )}
    </div>
  );
}
