import React from 'react';
import styles from './Avatar.module.css';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  alt?: string;
  'aria-label'?: string;
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'User',
  size = 'md',
  alt,
  'aria-label': ariaLabel,
}) => {
  const initials = getInitials(name);
  const finalAlt = alt || name;
  const finalAriaLabel = ariaLabel || `Avatar for ${name}`;

  return (
    <div className={`${styles.avatar} ${styles[size]}`} aria-label={finalAriaLabel}>
      {src ? (
        <img src={src} alt={finalAlt} className={styles.image} />
      ) : (
        <div className={styles.initials}>{initials}</div>
      )}
    </div>
  );
};
