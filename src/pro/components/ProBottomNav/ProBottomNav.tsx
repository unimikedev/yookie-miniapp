import { useNavigate, useLocation } from 'react-router-dom';
import styles from './ProBottomNav.module.css';

interface Tab {
  key: string;
  label: string;
  path: string;
  icon: string;
}

const tabs: Tab[] = [
  { key: 'dashboard', label: 'Обзор', path: '/pro', icon: '◎' },
  { key: 'bookings', label: 'Записи', path: '/pro/bookings', icon: '▦' },
  { key: 'schedule', label: 'График', path: '/pro/schedule', icon: '◷' },
  { key: 'services', label: 'Услуги', path: '/pro/services', icon: '✦' },
  { key: 'more', label: 'Ещё', path: '/pro/more', icon: '⋯' },
];

export function ProBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/pro') return location.pathname === '/pro';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.pill}>
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.key}
              className={`${styles.tab} ${active ? styles.tabActive : ''}`}
              onClick={() => navigate(tab.path)}
              aria-label={tab.label}
            >
              <span className={styles.icon}>{tab.icon}</span>
              <span className={`${styles.label} ${active ? styles.labelActive : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
