import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './BottomNav.module.css';

interface BottomNavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  ariaLabel?: string;
  end?: boolean;
}

const HomeIcon = ({ active }: { active?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V16H9V21H4C3.44772 21 3 20.5523 3 20V10.5Z"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const MapIcon = ({ active }: { active?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2C8.68629 2 6 4.68629 6 8C6 12.5 12 19 12 19C12 19 18 12.5 18 8C18 4.68629 15.3137 2 12 2Z"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <circle cx="12" cy="8" r="2.5" fill={active ? 'var(--color-bg)' : 'none'} stroke={active ? 'var(--color-bg)' : 'currentColor'} strokeWidth="1.8" />
  </svg>
);

const CalendarIcon = ({ active }: { active?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="5" width="18" height="16" rx="2" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" />
    <path d="M3 10H21" stroke={active ? 'var(--color-bg)' : 'currentColor'} strokeWidth="1.8" />
    <path d="M8 3V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M16 3V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const MenuIcon = ({ active }: { active?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="5" cy="12" r="2" fill="currentColor" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <circle cx="19" cy="12" r="2" fill="currentColor" />
  </svg>
);

const defaultItems: BottomNavItem[] = [
  { path: '/', label: 'Главная', icon: <HomeIcon />, activeIcon: <HomeIcon active />, ariaLabel: 'Главная страница', end: true },
  { path: '/search', label: 'Рядом', icon: <MapIcon />, activeIcon: <MapIcon active />, ariaLabel: 'Рядом с вами' },
  { path: '/my-bookings', label: 'Записи', icon: <CalendarIcon />, activeIcon: <CalendarIcon active />, ariaLabel: 'Мои записи' },
  { path: '/menu', label: 'Меню', icon: <MenuIcon />, activeIcon: <MenuIcon active />, ariaLabel: 'Меню' },
];

interface BottomNavProps {
  items?: BottomNavItem[];
}

export const BottomNav: React.FC<BottomNavProps> = ({ items = defaultItems }) => {
  return (
    <div className={styles.navWrapper}>
      <nav className={styles.nav} role="navigation" aria-label="Основная навигация">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}
            aria-label={item.ariaLabel || item.label}
          >
            {({ isActive }) => (
              <>
                <span className={styles.icon}>
                  {isActive && item.activeIcon ? item.activeIcon : item.icon}
                </span>
                <span className={styles.label}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
