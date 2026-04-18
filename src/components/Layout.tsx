import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePlatform } from '@/hooks/usePlatform'
import { useOverlayStore } from '@/stores/overlayStore'
import { useTelegramSafeArea } from '@/hooks/useTelegramSafeArea'
import { BottomNav } from '@/shared/ui'
import styles from './Layout.module.css'

// The 4 root tab pages — everywhere else gets Telegram back button + no bottom nav
const PAGES_WITH_NAV = ['/', '/nearby', '/my-bookings', '/account']

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const platform = usePlatform()
  const location = useLocation()
  const navigate = useNavigate()
  const { isOpen: isOverlayOpen } = useOverlayStore()
  const tgBackHandlerRef = useRef<(() => void) | null>(null)

  // Apply Telegram safe area insets to CSS vars — runs once, listens for mode changes
  useTelegramSafeArea()

  const isProRoute = location.pathname.startsWith('/pro')
  const showNav = PAGES_WITH_NAV.includes(location.pathname) && !isOverlayOpen
  const showTgBack = !PAGES_WITH_NAV.includes(location.pathname)

  useEffect(() => {
    const isDark = platform.theme === 'dark'
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [platform.theme])

  // Global Telegram BackButton — shows on detail/nested pages, hides on root tabs and pro routes
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (!tg) return

    if (tgBackHandlerRef.current) {
      tg.BackButton.offClick(tgBackHandlerRef.current)
      tgBackHandlerRef.current = null
    }

    if (showTgBack) {
      const handler = () => navigate(-1)
      tgBackHandlerRef.current = handler
      tg.BackButton.onClick(handler)
      tg.BackButton.show()
    } else {
      tg.BackButton.hide()
    }

    return () => {
      if (tgBackHandlerRef.current) {
        tg.BackButton.offClick(tgBackHandlerRef.current)
        tgBackHandlerRef.current = null
      }
    }
  }, [showTgBack, navigate])

  return (
    <div className={styles.layout}>
      <main className={`${styles.main} ${showNav ? styles.withNav : ''}`}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  )
}
