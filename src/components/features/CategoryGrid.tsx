import React from 'react';
import { useTranslation } from 'react-i18next';
import { CategoryEnum } from '@/lib/api/types';
import { CATEGORY_ICONS } from '@/shared/constants';
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

export const CategoryGrid: React.FC<CategoryGridProps> = ({ onSelect }) => {
  const { t } = useTranslation();
  const handleSelect = (category: CategoryEnum) => {
    onSelect(category);
  };

  return (
    <div className={styles.grid}>
      {FEATURED_CATEGORIES.map((category) => {
        const iconSrc = CATEGORY_ICONS[category] || CATEGORY_ICONS['other'];
        const label = t(`categories.${category}`);

        return (
          <button
            key={category}
            className={styles.card}
            onClick={() => handleSelect(category)}
            aria-label={label}
          >
            <img src={iconSrc} alt="" className={styles.icon} />
            <div className={styles.label}>{label}</div>
          </button>
        );
      })}
    </div>
  );
};
