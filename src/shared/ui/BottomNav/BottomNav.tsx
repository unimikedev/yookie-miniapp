import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './BottomNav.module.css'

export interface BottomNavProps {
  className?: string
  visible?: boolean
}

const tabs = [
  {
    key: 'home',
    label: 'nav.home',
    path: '/',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 1.25C12.87 1.25 13.64 1.53 14.48 2L18.89 5.06C19.83 5.73 20.58 6.27 21.14 6.77C21.72 7.29 22.16 7.81 22.43 8.46C22.71 9.1 22.78 9.77 22.74 10.54C22.7 11.28 22.57 12.17 22.4 13.29L22.08 15.34C21.84 16.92 21.64 18.18 21.36 19.17C21.06 20.18 20.65 20.99 19.91 21.61C19.17 22.22 18.29 22.49 17.22 22.62C16.17 22.75 14.85 22.75 13.19 22.75H10.81C9.15 22.75 7.83 22.75 6.78 22.62C5.71 22.49 4.83 22.22 4.09 21.61C3.35 20.99 2.94 20.18 2.64 19.17C2.36 18.18 2.16 16.92 1.92 15.34L1.6 13.29C1.43 12.17 1.3 11.28 1.26 10.54C1.22 9.77 1.29 9.1 1.57 8.46C1.84 7.81 2.28 7.29 2.86 6.77C3.43 6.27 4.17 5.73 5.11 5.06L9.52 2C10.36 1.53 11.13 1.25 12 1.25Z" fill="currentColor"/>
      </svg>
    )
  },
  {
    key: 'nearby',
    label: 'nav.nearby',
    path: '/nearby',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 1.25C16.48 1.25 20.25 5.02 20.25 9.59C20.25 14.25 16.4 17.41 13.17 19.43C12.8 19.64 12.4 19.75 12 19.75C11.6 19.75 11.2 19.64 10.85 19.44L10.84 19.44C7.61 17.39 3.75 14.27 3.75 9.59C3.75 5.02 7.52 1.25 12 1.25ZM12 6C9.93 6 8.25 7.57 8.25 9.5C8.25 11.43 9.93 13 12 13C14.07 13 15.75 11.43 15.75 9.5C15.75 7.57 14.07 6 12 6Z" fill="currentColor"/>
      </svg>
    )
  },
  {
    key: 'bookings',
    label: 'nav.bookings',
    path: '/my-bookings',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15.69 13.7H15.7M15.69 16.7H15.7M11.99 13.7H12M11.99 16.7H12M8.29 13.7H8.3M8.29 16.7H8.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    key: 'menu',
    label: 'nav.menu',
    path: '/account',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M6 13.25C8.62 13.25 10.75 15.38 10.75 18C10.75 20.62 8.62 22.75 6 22.75C3.38 22.75 1.25 20.62 1.25 18C1.25 15.38 3.38 13.25 6 13.25ZM18 13.25C20.62 13.25 22.75 15.38 22.75 18C22.75 20.62 20.62 22.75 18 22.75C15.38 22.75 13.25 20.62 13.25 18C13.25 15.38 15.38 13.25 18 13.25ZM6 1.25C8.62 1.25 10.75 3.38 10.75 6C10.75 8.62 8.62 10.75 6 10.75C3.38 10.75 1.25 8.62 1.25 6C1.25 3.38 3.38 1.25 6 1.25ZM18 1.25C20.62 1.25 22.75 3.38 22.75 6C22.75 8.62 20.62 10.75 18 10.75C15.38 10.75 13.25 8.62 13.25 6C13.25 3.38 15.38 1.25 18 1.25Z" fill="currentColor"/>
      </svg>
    )
  }
]

export function BottomNav({ className, visible = true }: BottomNavProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()

  const getActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <nav className={`${styles.nav} ${className ?? ''} ${visible ? '' : styles.navHidden}`}>
      <div className={styles.pill}>
        {tabs.map(tab => {
          const active = getActive(tab.path)
          return (
            <button
              key={tab.key}
              className={`${styles.tab} ${active ? styles.tabActive : ''}`}
              onClick={() => navigate(tab.path)}
              aria-label={t(tab.label)}
            >
              <span className={styles.icon}>{tab.icon(active)}</span>
              <span className={`${styles.label} ${active ? styles.labelVisible : ''}`}>{t(tab.label)}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
