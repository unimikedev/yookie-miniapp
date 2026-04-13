/**
 * Badge — shared/ui wrapper
 * App-custom status badge (no direct HeroUI native equivalent).
 * Maps to HeroUI Chip semantics internally.
 */
import React, { ReactNode } from 'react';
import styles from './Badge.module.css';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className,
}) => (
  <span
    className={[styles.root, styles[`variant-${variant}`], className ?? ''].filter(Boolean).join(' ')}
    role="status"
  >
    {children}
  </span>
);
