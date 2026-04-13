import React, { ReactNode } from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  children: ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className,
}) => {
  return (
    <span
      className={`${styles.badge} ${styles[variant]} ${className || ''}`}
      role="status"
    >
      {children}
    </span>
  );
};
