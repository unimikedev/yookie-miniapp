import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to track navigation direction for page transition animations
 * Returns the previous pathname and a flag indicating if navigation is forward (deeper) or backward
 */
export function useNavigationDirection() {
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);
  const directionRef = useRef<'forward' | 'backward'>('forward');

  useEffect(() => {
    // Compare current path depth with previous to determine direction
    const currentDepth = location.pathname.split('/').filter(Boolean).length;
    const previousDepth = previousPathRef.current.split('/').filter(Boolean).length;

    if (currentDepth > previousDepth) {
      directionRef.current = 'forward'; // Going deeper - slide in from right
    } else if (currentDepth < previousDepth) {
      directionRef.current = 'backward'; // Going back - slide out to right
    } else {
      // Same depth - check if it's a different section
      directionRef.current = 'forward';
    }

    previousPathRef.current = location.pathname;
  }, [location]);

  return {
    direction: directionRef.current,
    previousPath: previousPathRef.current,
  };
}
