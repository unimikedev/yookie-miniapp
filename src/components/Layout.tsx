import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { usePlatform } from '@/hooks/usePlatform'
import { useOverlayStore } from '@/stores/overlayStore'
import { useTelegramSafeArea } from '@/hooks/useTelegramSafeArea'
import { BottomNav } from '@/shared/ui'
import styles from './Layout.module.css'

const PAGES_WITH_NAV = ['/', '/search', '/nearby', '/my-bookings', '/favorites', '/account']

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const platform = usePlatform()
  const location = useLocation()
  const { isOpen: isOverlayOpen } = useOverlayStore()

  // Apply Telegram safe area insets to CSS vars — runs once, listens for mode changes
  useTelegramSafeArea()

  const isProRoute = location.pathname.startsWith('/pro')
  const showNav = PAGES_WITH_NAV.includes(location.pathname) && !isOverlayOpen && !isProRoute

  useEffect(() => {
    const isDark = platform.theme === 'dark'
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [platform.theme])

  return (
    <div className={styles.layout}>
      <main className={`${styles.main} ${showNav ? styles.withNav : ''}`}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  )
}
