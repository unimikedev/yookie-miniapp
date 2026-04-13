import React, { ReactNode } from 'react';
import styles from './Tag.module.css';

interface TagProps {
  active?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  icon?: ReactNode;
  'aria-label'?: string;
  'aria-pressed'?: boolean;
}

export const Tag: React.FC<TagProps> = ({
  active = false,
  onClick,
  children,
  icon,
  'aria-label': ariaLabel,
  'aria-pressed': ariaPressed,
}) => {
  return (
    <button
      className={`${styles.tag} ${active ? styles.active : ''}`}
      onClick={onClick}
      type="button"
      aria-label={ariaLabel}
      aria-pressed={ariaPressed !== undefined ? ariaPressed : active}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
