import React from 'react';
import { Booking } from '@/lib/api/types';
import { Badge, Button } from '@/shared/ui';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import styles from './BookingCard.module.css';

interface BookingCardProps {
  booking: Booking & {
    businessName?: string;
    serviceName?: string;
    masterName?: string;
  };
  onCancel?: (booking: Booking) => void;
  onReview?: (booking: Booking) => void;
}

const getStatusBadgeVariant = (
  status: string,
): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'confirmed':
      return 'success';
    case 'completed':
      return 'info';
    case 'cancelled':
      return 'neutral';
    case 'no_show':
      return 'error';
    default:
      return 'neutral';
  }
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'Ожидание',
    confirmed: 'Подтверждено',
    completed: 'Завершено',
    cancelled: 'Отменено',
    no_show: 'Не явился',
  };
  return labels[status] || status;
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('uz-UZ', {
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return format(date, 'dd MMMM, eee', { locale: ru });
  } catch {
    return dateString;
  }
};

const formatTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return format(date, 'HH:mm');
  } catch {
    return dateString;
  }
};

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onCancel,
  onReview,
}) => {
  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
  const canReview = booking.status === 'completed';

  const handleCancel = () => {
    if (onCancel) {
      onCancel(booking);
    }
  };

  const handleReview = () => {
    if (onReview) {
      onReview(booking);
    }
  };

  const date = formatDateTime(booking.starts_at);
  const time = formatTime(booking.starts_at);
  const price = formatPrice(booking.price);
  const statusLabel = getStatusLabel(booking.status);
  const statusVariant = getStatusBadgeVariant(booking.status);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titles}>
          <h3 className={styles.businessName}>{booking.businessName || 'Бизнес'}</h3>
          <p className={styles.serviceName}>{booking.serviceName || 'Услуга'}</p>
        </div>
        <Badge variant={statusVariant}>{statusLabel}</Badge>
      </div>

      <div className={styles.details}>
        <div className={styles.detailRow}>
          <span className={styles.label}>Мастер:</span>
          <span className={styles.value}>{booking.masterName || 'Не указан'}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.label}>Дата:</span>
          <span className={styles.value}>{date}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.label}>Время:</span>
          <span className={styles.value}>{time}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.label}>Цена:</span>
          <span className={`${styles.value} ${styles.price}`}>{price} сўм</span>
        </div>
      </div>

      {(canCancel || canReview) && (
        <div className={styles.actions}>
          {canCancel && (
            <Button
              variant="danger"
              size="sm"
              fullWidth
              onClick={handleCancel}
              aria-label="Отменить бронирование"
            >
              Отменить
            </Button>
          )}
          {canReview && (
            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={handleReview}
              aria-label="Оставить отзыв"
            >
              Оставить отзыв
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
