import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import styles from './ProBottomNav.module.css';

interface Tab {
  key: string;
  labelKey: string;
  path: string;
  icon: string;
}

const ownerTabs: Tab[] = [
  { key: 'dashboard', labelKey: 'nav.proSchedule', path: '/pro',          icon: '◎' },
  { key: 'bookings',  labelKey: 'nav.proBookings', path: '/pro/bookings', icon: '▦' },
  { key: 'clients',   labelKey: 'nav.proClients',  path: '/pro/clients',  icon: '◉' },
  { key: 'more',      labelKey: 'nav.proMore',     path: '/pro/more',     icon: '⋯' },
];

const staffTabs: Tab[] = [
  { key: 'bookings', labelKey: 'nav.proBookings',    path: '/pro/bookings',    icon: '▦' },
  { key: 'schedule', labelKey: 'nav.proScheduleTab', path: '/pro/schedule',    icon: '◷' },
  { key: 'profile',  labelKey: 'nav.proProfile',     path: '/pro/my-profile',  icon: '◉' },
];

export function ProBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useMerchantStore();
  const { t } = useTranslation();

  const tabs = role === 'staff' ? staffTabs : ownerTabs;

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
              onClick={() => navigate(tab.path, { replace: true })}
              aria-label={t(tab.labelKey)}
            >
              <span className={styles.icon}>{tab.icon}</span>
              <span className={`${styles.label} ${active ? styles.labelActive : ''}`}>
                {t(tab.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
