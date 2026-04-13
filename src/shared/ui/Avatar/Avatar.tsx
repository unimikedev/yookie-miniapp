/**
 * Avatar — shared/ui wrapper
 * HeroUI ref: heroui-native-main/src/components/avatar
 * Variants: default | soft   Sizes: sm | md | lg
 * Colors: accent | default | success | warning | danger
 */
import React from 'react';
import styles from './Avatar.module.css';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
export type AvatarVariant = 'default' | 'soft';
export type AvatarColor = 'accent' | 'default' | 'success' | 'warning' | 'danger';

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: AvatarSize;
  variant?: AvatarVariant;
  color?: AvatarColor;
  alt?: string;
  className?: string;
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'User',
  size = 'md',
  variant = 'default',
  color = 'accent',
  alt,
  className,
}) => {
  const rootClass = [
    styles.root,
    styles[`size-${size}`],
    styles[`variant-${variant}`],
    styles[`color-${color}`],
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} aria-label={alt ?? name} role="img">
      {src ? (
        <img src={src} alt={alt ?? name} className={styles.image} />
      ) : (
        <span className={styles.initials} aria-hidden="true">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
};
