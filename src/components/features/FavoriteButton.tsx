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
      <span className={styles.heart} aria-hidden="true">
        ♥
      </span>
    </button>
  );
};
