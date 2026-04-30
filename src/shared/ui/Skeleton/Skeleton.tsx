/**
 * Skeleton — shared/ui wrapper
 * HeroUI ref: heroui-native-main/src/components/skeleton
 * Dynamic width/height passed via CSS custom properties on the element.
 */
import React from 'react';
import styles from './Skeleton.module.css';

export type SkeletonVariant = 'text' | 'circle' | 'rect';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
  style?: React.CSSProperties;
}

const toPx = (v: string | number): string =>
  typeof v === 'number' ? `${v}px` : v;

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width = '100%',
  height,
  count = 1,
  className,
  style,
}) => {
  const resolvedHeight =
    height ?? (variant === 'circle' ? 40 : variant === 'text' ? 16 : 200);

  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, i) => (
        <div
          key={i}
          className={[styles.root, styles[variant], className ?? ''].filter(Boolean).join(' ')}
          style={
            {
              '--sk-w': toPx(width),
              '--sk-h': toPx(resolvedHeight),
              ...style,
            } as React.CSSProperties
          }
          role="status"
          aria-label="Loading"
        />
      ))}
    </>
  );
};
