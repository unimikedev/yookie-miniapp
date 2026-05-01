import React, { useState } from 'react';
import { useFavoritesStore } from '@/stores/favoritesStore';
import styles from './FavoriteButton.module.css';

interface FavoriteButtonProps {
  businessId: string;
  size?: 'sm' | 'md';
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  businessId,
  size = 'md',
}) => {
  const { isFavorite, toggle } = useFavoritesStore();
  const [isAnimating, setIsAnimating] = useState(false);

  const liked = isFavorite(businessId);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    setIsAnimating(true);
    toggle(businessId);

    // Reset animation state after animation completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  return (
    <button
      className={`${styles.button} ${styles[size]} ${liked ? styles.liked : ''} ${
        isAnimating ? styles.animating : ''
      }`}
      onClick={handleClick}
      aria-label={liked ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={liked}
      type="button"
    >
      <svg
        className={styles.heart}
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
};
