import React from 'react';
import { CategoryEnum, CATEGORY_LABELS } from '@/lib/api/types';
import styles from './CategoryGrid.module.css';

interface CategoryGridProps {
  onSelect: (category: CategoryEnum) => void;
}

const FEATURED_CATEGORIES: CategoryEnum[] = [
  'hair',
  'nail',
  'brow_lash',
  'makeup',
  'spa_massage',
  'epilation',
  'cosmetology',
  'barber',
  'tattoo',
  'piercing',
  'yoga',
  'fitness',
];

const getCategoryEmoji = (category: string): string => {
  const emojiMap: Record<string, string> = {
    hair: '💇‍♀️',
    nail: '💅',
    brow_lash: '👁️',
    makeup: '💄',
    spa_massage: '🧖',
    epilation: '🪒',
    cosmetology: '✨',
    barber: '✂️',
    tattoo: '🖊️',
    piercing: '👂',
    yoga: '🧘',
    fitness: '🏋️‍♂️',
    other: '🏪',
  };
  return emojiMap[category] || '🏪';
};

export const CategoryGrid: React.FC<CategoryGridProps> = ({ onSelect }) => {
  const handleSelect = (category: CategoryEnum) => {
    onSelect(category);
  };

  return (
    <div className={styles.grid}>
      {FEATURED_CATEGORIES.map((category) => {
        const emoji = getCategoryEmoji(category);
        const label = CATEGORY_LABELS[category];

        return (
          <button
            key={category}
            className={styles.card}
            onClick={() => handleSelect(category)}
            aria-label={label}
          >
            <div className={styles.emoji}>{emoji}</div>
            <div className={styles.label}>{label}</div>
          </button>
        );
      })}
    </div>
  );
};
