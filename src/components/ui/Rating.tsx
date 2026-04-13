import React from 'react';
import styles from './Rating.module.css';

interface RatingProps {
  value: number;
  count?: number;
  size?: 'sm' | 'md';
  'aria-label'?: string;
}

export const Rating: React.FC<RatingProps> = ({
  value,
  count,
  size = 'md',
  'aria-label': ariaLabel,
}) => {
  const ratingValue = Math.max(0, Math.min(5, value));
  const ratingLabel = ariaLabel || `Rating: ${ratingValue.toFixed(1)} out of 5${count ? ` from ${count} reviews` : ''}`;

  return (
    <div className={`${styles.rating} ${styles[size]}`} aria-label={ratingLabel}>
      <span className={styles.star} aria-hidden="true">
        ★
      </span>
      <span className={styles.value}>{ratingValue.toFixed(1)}</span>
      {count !== undefined && <span className={styles.count}>({count})</span>}
    </div>
  );
};
