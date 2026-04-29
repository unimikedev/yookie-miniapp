import React from 'react';
import { Service } from '@/lib/api/types';
import type { AddonSelection } from '@/stores/bookingStore';
import styles from './ServiceItem.module.css';

interface ServiceItemProps {
  service: Service;
  selected?: boolean;
  onSelect?: (service: Service) => void;
  selectedAddons?: AddonSelection[];
  onEditAddons?: (service: Service) => void;
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
  selectedAddons = [],
  onEditAddons,
}) => {
  const hasAddons = (service.addons ?? []).length > 0;
  const addonsTotalPrice = selectedAddons.reduce((s, a) => s + a.price_each * a.qty, 0);
  const addonsTotalDuration = selectedAddons.reduce((s, a) => s + a.duration_min_each * a.qty, 0);

  const displayPrice = formatPrice(service.price + addonsTotalPrice);
  const displayDuration = service.duration_min + addonsTotalDuration;

  const description = service.description
    ? service.description.length > 60
      ? service.description.substring(0, 60) + '...'
      : service.description
    : '';

  return (
    <div className={`${styles.item} ${selected ? styles.selected : ''}`}>
      <div
        className={styles.mainRow}
        onClick={() => onSelect?.(service)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(service); } }}
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
          <div className={styles.duration}>{displayDuration} мин</div>
          <div className={styles.price}>{displayPrice} сўм</div>
        </div>
      </div>

      {/* Addons line — shown when service is selected and has addons */}
      {selected && hasAddons && (
        <div className={styles.addonsRow}>
          {selectedAddons.length > 0 ? (
            <span className={styles.addonsSummary}>
              {selectedAddons.map(a => `${a.name}${a.qty > 1 ? ` ×${a.qty}` : ''}`).join(', ')}
            </span>
          ) : (
            <span className={styles.addonsEmpty}>Дополнения не выбраны</span>
          )}
          <button
            className={styles.addonsEditBtn}
            onClick={(e) => { e.stopPropagation(); onEditAddons?.(service); }}
          >
            {selectedAddons.length > 0 ? 'Изменить' : '+ Добавить'}
          </button>
        </div>
      )}
    </div>
  );
};
