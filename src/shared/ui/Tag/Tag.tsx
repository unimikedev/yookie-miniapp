/**
 * Tag — shared/ui wrapper
 * HeroUI ref: tag-group (standalone tag chip)
 */
import React, { ReactNode } from 'react';
import styles from './Tag.module.css';

export interface TagProps {
  active?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  'aria-label'?: string;
  'aria-pressed'?: boolean;
}

export const Tag: React.FC<TagProps> = ({
  active = false,
  onClick,
  children,
  icon,
  className,
  'aria-label': ariaLabel,
  'aria-pressed': ariaPressed,
}) => (
  <button
    type="button"
    className={[styles.root, active ? styles.active : '', className ?? ''].filter(Boolean).join(' ')}
    onClick={onClick}
    aria-label={ariaLabel}
    aria-pressed={ariaPressed !== undefined ? ariaPressed : active}
  >
    {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
    <span>{children}</span>
  </button>
);
