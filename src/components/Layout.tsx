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

  useEffect(() => {
    const isDark = platform.theme === 'dark'
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')

    document.documentElement.style.setProperty('--viewport-height', `${platform.viewportHeight}px`)
    document.documentElement.style.setProperty('--viewport-stable-height', `${platform.viewportStableHeight}px`)
  }, [platform.theme, platform.viewportHeight, platform.viewportStableHeight])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerHeight !== platform.viewportHeight) {
        document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [platform.viewportHeight])

  return (
    <div className={styles.layout}>
      <main className={`${styles.main} ${showNav ? styles.withNav : ''}`}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  )
}
