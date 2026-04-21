import React, { ReactNode, useRef, useEffect } from 'react';
import { useOverlayStore } from '@/stores/overlayStore';
import styles from './BottomSheet.module.css';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  'aria-label'?: string;
  /** Skip the content wrapper's padding and overflow — use when child controls its own scroll/layout */
  fullHeight?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  title,
  children,
  'aria-label': ariaLabel,
  fullHeight = false,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const startTransformRef = useRef<number>(0);
  const { open: openOverlay, close: closeOverlay } = useOverlayStore();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      openOverlay();
    } else {
      document.body.style.overflow = '';
      closeOverlay();
    }

    return () => {
      document.body.style.overflow = '';
      closeOverlay();
    };
  }, [open, openOverlay, closeOverlay]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const handle = e.currentTarget.closest(`.${styles.handle}`);
    if (!handle) return;

    startYRef.current = e.touches[0].clientY;
    startTransformRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (startYRef.current === 0) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    if (diff > 0 && sheetRef.current) {
      startTransformRef.current = diff;
      sheetRef.current.style.transform = `translateY(${diff}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (startTransformRef.current > 100 && sheetRef.current) {
      onClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }
    startYRef.current = 0;
    startTransformRef.current = 0;
  };

  const handleBackdropClick = () => {
    onClose();
  };

  return (
    <>
      {open && (
        <div
          className={styles.backdrop}
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}
      <div
        ref={sheetRef}
        className={`${styles.sheet} ${open ? styles.open : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.handle}>
          <div className={styles.handleBar} aria-hidden="true" />
        </div>

        {title && (
          <div className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close"
              type="button"
            >
              ✕
            </button>
          </div>
        )}

        <div className={`${styles.content} ${fullHeight ? styles.contentFull : ''}`}>{children}</div>
      </div>
    </>
  );
};
