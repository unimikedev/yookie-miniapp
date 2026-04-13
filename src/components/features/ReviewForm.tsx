/**
 * ReviewForm — modal for submitting a review after a completed booking.
 */

import { useState } from 'react';
import { createReview } from '@/lib/api/reviews';
import { useAuthStore } from '@/stores/authStore';
import type { Booking } from '@/lib/api/types';
import styles from './ReviewForm.module.css';

interface ReviewFormProps {
  booking: Booking & {
    businessName?: string;
    serviceName?: string;
    masterName?: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewForm({ booking, onClose, onSuccess }: ReviewFormProps) {
  const authStore = useAuthStore();
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await createReview({
        bookingId: booking.id,
        rating,
        comment: comment.trim() || undefined,
        phone: authStore.user?.phone || '',
      });
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Не удалось отправить отзыв';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Оставить отзыв</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className={styles.bookingInfo}>
          <span className={styles.bookingName}>{booking.businessName}</span>
          {booking.masterName && (
            <span className={styles.bookingMaster}> • {booking.masterName}</span>
          )}
          {booking.serviceName && (
            <span className={styles.bookingService}> / {booking.serviceName}</span>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div className={styles.ratingSection}>
            <label className={styles.ratingLabel}>Ваша оценка</label>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`${styles.star} ${(hoveredRating || rating) >= star ? styles.starActive : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  {star <= (hoveredRating || rating) ? '★' : '☆'}
                </button>
              ))}
            </div>
            <span className={styles.ratingText}>
              {rating === 5 && 'Отлично!'}
              {rating === 4 && 'Хорошо'}
              {rating === 3 && 'Нормально'}
              {rating === 2 && 'Плохо'}
              {rating === 1 && 'Ужасно'}
            </span>
          </div>

          {/* Comment */}
          <div className={styles.commentSection}>
            <label className={styles.commentLabel}>Комментарий (необязательно)</label>
            <textarea
              className={styles.textarea}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Расскажите о вашем опыте..."
              rows={4}
              maxLength={500}
            />
            <span className={styles.charCount}>{comment.length}/500</span>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {/* Submit */}
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? 'Отправка...' : 'Отправить отзыв'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
