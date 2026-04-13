import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { usePlatform } from '@/hooks/usePlatform'
import { useOverlayStore } from '@/stores/overlayStore'
import { BottomNav } from '@/shared/ui'
import styles from './Layout.module.css'

const PAGES_WITH_NAV = ['/', '/search', '/nearby', '/my-bookings', '/favorites', '/account', '/profile/edit']

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const platform = usePlatform()
  const location = useLocation()
  const { isOpen: isOverlayOpen } = useOverlayStore()

  const showNav = PAGES_WITH_NAV.includes(location.pathname) && !isOverlayOpen

  // Telegram platform already sets --viewport-height, --viewport-stable-height,
  // and --safe-area-* CSS vars during init. No need for window resize listener.
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
