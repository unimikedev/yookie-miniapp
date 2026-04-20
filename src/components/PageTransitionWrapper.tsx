import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigationDirection } from '@/hooks/useNavigationDirection';
import styles from './PageTransitionWrapper.module.css';

interface PageTransitionWrapperProps {
  children: React.ReactNode;
}

export default function PageTransitionWrapper({ children }: PageTransitionWrapperProps) {
  const location = useLocation();
  const { direction } = useNavigationDirection();
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    // Set animation class based on navigation direction
    if (direction === 'forward') {
      // Going deeper: slide in from right, exit to left
      setAnimationClass(styles.forwardEnter);
    } else {
      // Going back: slide in from left, exit to right
      setAnimationClass(styles.backwardEnter);
    }

    // Clear animation class after animation completes
    const timer = setTimeout(() => {
      setAnimationClass('');
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname, direction]);

  return (
    <div className={`${styles.pageContainer} ${animationClass}`}>
      {children}
    </div>
  );
}
