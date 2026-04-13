/**
 * Tabs — shared/ui wrapper
 * HeroUI ref: heroui-native-main/src/components/tabs
 * Flat API: tabs[], activeKey, onChange
 */
import React, { useRef, useEffect } from 'react';
import styles from './Tabs.module.css';

export interface TabItem {
  key: string;
  label: string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  variant?: 'primary' | 'secondary';
  className?: string;
  'aria-label'?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeKey,
  onChange,
  variant = 'primary',
  className,
  'aria-label': ariaLabel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const tab = activeRef.current;
      const cRect = container.getBoundingClientRect();
      const tRect = tab.getBoundingClientRect();
      if (tRect.left < cRect.left) container.scrollLeft -= cRect.left - tRect.left;
      else if (tRect.right > cRect.right) container.scrollLeft += tRect.right - cRect.right;
    }
  }, [activeKey]);

  return (
    <div
      ref={containerRef}
      className={[styles.root, styles[`variant-${variant}`], className ?? ''].filter(Boolean).join(' ')}
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            ref={isActive ? activeRef : null}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`panel-${tab.key}`}
            className={[styles.tab, isActive ? styles.active : ''].filter(Boolean).join(' ')}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
