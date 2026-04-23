import { useEffect, useRef, useState } from 'react';
import styles from './Toast.module.css';

interface ToastProps {
  message: string;
  onDone: () => void;
  duration?: number;
}

export function Toast({ message, onDone, duration = 2200 }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Animate in
    const show = setTimeout(() => setVisible(true), 10);
    // Animate out
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 280);
    }, duration);
    return () => {
      clearTimeout(show);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [duration, onDone]);

  return (
    <div className={`${styles.toast} ${visible ? styles.visible : ''}`}>
      {message}
    </div>
  );
}
