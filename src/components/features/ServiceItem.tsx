import React from 'react';
import { Service } from '@/lib/api/types';
import styles from './ServiceItem.module.css';

interface ServiceItemProps {
  service: Service;
  selected?: boolean;
  onSelect?: (service: Service) => void;
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('uz-UZ', {
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export const ServiceItem: React.FC<ServiceItemProps> = ({
  service,
  selected = false,
  onSelect,
}) => {
  const handleClick = () => {
    if (onSelect) {
      onSelect(service);
    }
  };

  const price = formatPrice(service.price);
  const description = service.description
    ? service.description.length > 60
      ? service.description.substring(0, 60) + '...'
      : service.description
    : '';

  return (
    <div
      className={`${styles.item} ${selected ? styles.selected : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className={styles.checkbox}>
        <input
          type="radio"
          name="service-selector"
          checked={selected}
          onChange={() => onSelect?.(service)}
          aria-label={service.name}
        />
      </div>

      <div className={styles.content}>
        <h4 className={styles.name}>{service.name}</h4>
        {description && <p className={styles.description}>{description}</p>}
      </div>

      <div className={styles.details}>
        <div className={styles.duration}>{service.duration_min} мин</div>
        <div className={styles.price}>{price} сўм</div>
      </div>
    </div>
  );
};
