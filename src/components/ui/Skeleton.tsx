import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect';
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width = '100%',
  height = variant === 'circle' ? 40 : variant === 'text' ? 16 : 200,
  count = 1,
  className,
}) => {
  const skeletons = Array.from({ length: count });

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <>
      {skeletons.map((_, index) => (
        <div
          key={index}
          className={`${styles.skeleton} ${styles[variant]} ${className || ''}`}
          style={style}
          role="status"
          aria-label="Loading"
        />
      ))}
    </>
  );
};
