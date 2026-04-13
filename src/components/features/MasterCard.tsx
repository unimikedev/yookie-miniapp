import React from 'react';
import { Master } from '@/lib/api/types';
import { Avatar, Rating, Badge } from '@/shared/ui';
import { getMockMasterImage } from '@/lib/utils/mockImages';
import styles from './MasterCard.module.css';

interface MasterCardProps {
  master: Master;
  onClick?: (master: Master) => void;
}

export const MasterCard: React.FC<MasterCardProps> = ({ master, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(master);
    }
  };

  const statusBadge = master.is_active ? (
    <Badge variant="success">Активен</Badge>
  ) : (
    <Badge variant="error">Неактивен</Badge>
  );

  return (
    <div className={styles.card} onClick={handleClick}>
      <div className={styles.avatar}>
        <Avatar
          src={master.photo_url ?? getMockMasterImage(master.id)}
          name={master.name}
          size="lg"
        />
      </div>

      <div className={styles.content}>
        <h3 className={styles.name}>{master.name}</h3>
        <p className={styles.specialization}>{master.specialization}</p>

        <div className={styles.rating}>
          <Rating value={master.rating} count={master.review_count} size="sm" />
        </div>

        <div className={styles.status}>{statusBadge}</div>
      </div>
    </div>
  );
};
