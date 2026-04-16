/**
 * Input — shared/ui wrapper
 * HeroUI ref: heroui-native-main/src/components/input
 * Variants: primary | secondary
 */

import React from 'react';
import styles from './Input.module.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'primary' | 'secondary';
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  variant = 'primary',
  error,
  className = '',
  ...props
}) => {
  return (
    <div className={styles.wrapper}>
      <input
        className={`${styles.input} ${styles[variant]} ${className}`}
        {...props}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
};
