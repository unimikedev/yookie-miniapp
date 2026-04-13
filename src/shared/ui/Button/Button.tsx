/**
 * Button — shared/ui wrapper
 *
 * Wraps HeroUI Button pattern for the web.
 * Customise via Button.module.css tokens — never add inline styles.
 *
 * HeroUI ref: heroui-native-main/src/components/button
 */
import React, { forwardRef } from 'react';
import styles from './Button.module.css';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'danger-soft';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isIconOnly?: boolean;
  isDisabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isIconOnly = false,
      isDisabled = false,
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...rest
    },
    ref,
  ) => {
    const isActuallyDisabled = isDisabled || disabled || loading;

    const rootClass = [
      styles.root,
      styles[`variant-${variant}`],
      styles[`size-${size}`],
      isIconOnly ? styles.iconOnly : '',
      fullWidth ? styles.fullWidth : '',
      isActuallyDisabled ? styles.disabled : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={rootClass}
        disabled={isActuallyDisabled}
        aria-busy={loading}
        aria-disabled={isActuallyDisabled}
        {...rest}
      >
        {loading && <span className={styles.spinner} aria-hidden="true" />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
