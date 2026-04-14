/**
 * EmptyState — shared/ui wrapper
 * App-custom component (no HeroUI native equivalent).
 */
import React, { ReactNode } from 'react';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title,
  description,
  action,
  compact = false,
}) => (
  <div className={`${styles.root} ${compact ? styles.rootCompact : ''}`} role="status" aria-label={title}>
    <div className={styles.icon} aria-hidden="true">{icon}</div>
    <h2 className={styles.title}>{title}</h2>
    {description && <p className={styles.description}>{description}</p>}
    {action && <div className={styles.action}>{action}</div>}
  </div>
);
