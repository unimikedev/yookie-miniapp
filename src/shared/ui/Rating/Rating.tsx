/**
 * Rating — shared/ui wrapper
 * App-custom component (no HeroUI native equivalent).
 * Supports read-only display with star count and review count label.
 */
import React from 'react';
import styles from './Rating.module.css';

export interface RatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  count?: number;
  onChange?: (value: number) => void;
  className?: string;
}

export const Rating: React.FC<RatingProps> = ({
  value,
  max = 5,
  size = 'md',
  readOnly = true,
  count,
  onChange,
  className,
}) => {
  return (
    <div
      className={[styles.root, styles[`size-${size}`], className ?? ''].filter(Boolean).join(' ')}
      role={readOnly ? 'img' : 'group'}
      aria-label={`${value.toFixed(1)} из ${max}${count !== undefined ? `, ${count} отзывов` : ''}`}
    >
      <div className={styles.stars}>
        {Array.from({ length: max }, (_, i) => {
          const filled = i < Math.round(value);
          return (
            <button
              key={i}
              type="button"
              className={[styles.star, filled ? styles.filled : styles.empty].join(' ')}
              aria-label={`${i + 1} звезда`}
              disabled={readOnly}
              onClick={() => !readOnly && onChange?.(i + 1)}
            >
              ★
            </button>
          );
        })}
      </div>
      {(value > 0 || count !== undefined) && (
        <span className={styles.label}>
          {value > 0 && <span className={styles.value}>{Number(value).toFixed(1)}</span>}
          {count !== undefined && count > 0 && (
            <span className={styles.count}>({count})</span>
          )}
        </span>
      )}
    </div>
  );
};
