import React, { useRef, useEffect } from 'react';
import styles from './Tabs.module.css';

interface Tab {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
  'aria-label'?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeKey,
  onChange,
  'aria-label': ariaLabel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeTabRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeTab = activeTabRef.current;
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();

      if (tabRect.left < containerRect.left) {
        container.scrollLeft -= containerRect.left - tabRect.left;
      } else if (tabRect.right > containerRect.right) {
        container.scrollLeft += tabRect.right - containerRect.right;
      }
    }
  }, [activeKey]);

  return (
    <div
      className={styles.tabsContainer}
      role="tablist"
      aria-label={ariaLabel}
      ref={containerRef}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          ref={tab.key === activeKey ? activeTabRef : null}
          role="tab"
          aria-selected={tab.key === activeKey}
          aria-controls={`panel-${tab.key}`}
          className={`${styles.tab} ${tab.key === activeKey ? styles.active : ''}`}
          onClick={() => onChange(tab.key)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
