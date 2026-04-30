import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import styles from './ProBottomNav.module.css';

const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="16" height="15" rx="3" />
    <path d="M6 1v4M14 1v4M2 8h16" />
  </svg>
)

const IconBookings = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h12a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
    <path d="M7 10h6M7 13h4" />
  </svg>
)

const IconClients = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="6" r="3.5" />
    <path d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6" />
  </svg>
)

const IconMore = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
    <circle cx="4" cy="10" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="10" cy="10" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="16" cy="10" r="1.2" fill="currentColor" stroke="none" />
  </svg>
)

const IconSchedule = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="8" />
    <path d="M10 5.5V10l3 2" />
  </svg>
)

interface Tab {
  key: string;
  labelKey: string;
  path: string;
  icon: React.ReactNode;
}

const ownerTabs: Tab[] = [
  { key: 'dashboard', labelKey: 'nav.proSchedule', path: '/pro',          icon: <IconCalendar /> },
  { key: 'bookings',  labelKey: 'nav.proBookings', path: '/pro/bookings', icon: <IconBookings /> },
  { key: 'clients',   labelKey: 'nav.proClients',  path: '/pro/clients',  icon: <IconClients /> },
  { key: 'more',      labelKey: 'nav.proMore',     path: '/pro/more',     icon: <IconMore /> },
];

const staffTabs: Tab[] = [
  { key: 'bookings', labelKey: 'nav.proBookings',    path: '/pro/bookings',    icon: <IconBookings /> },
  { key: 'schedule', labelKey: 'nav.proScheduleTab', path: '/pro/schedule',    icon: <IconSchedule /> },
  { key: 'profile',  labelKey: 'nav.proProfile',     path: '/pro/my-profile',  icon: <IconClients /> },
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
