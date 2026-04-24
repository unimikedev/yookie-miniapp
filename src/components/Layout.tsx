import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { useOverlayStore } from '@/stores/overlayStore'
import { useTelegramSafeArea } from '@/hooks/useTelegramSafeArea'
import { BottomNav } from '@/shared/ui'
import styles from './Layout.module.css'
import homeStyles from '@/pages/HomePage.module.css'

// The 4 root tab pages — everywhere else gets Telegram back button + no bottom nav
const PAGES_WITH_NAV = ['/', '/nearby', '/my-bookings', '/account']
const TAB_PATHS = new Set(PAGES_WITH_NAV)

interface LayoutProps {
  children: React.ReactNode
}

function getEnterClass(fromPath: string, toPath: string): string {
  const fromIsTab = TAB_PATHS.has(fromPath)
  const toIsTab = TAB_PATHS.has(toPath)
  if (fromIsTab && toIsTab) return styles.pageFade
  if (!fromIsTab && toIsTab) return styles.pageBack
  return styles.pageFwd
}

function getExitClass(fromPath: string, toPath: string): string {
  const fromIsTab = TAB_PATHS.has(fromPath)
  const toIsTab = TAB_PATHS.has(toPath)
  if (fromIsTab && toIsTab) return styles.pageFadeOut
  if (!fromIsTab && toIsTab) return styles.pageBackExit
  return styles.pageFwdExit
}

const TRANSITION_MS = 260

const HeartIcon = () => (
  <svg width="20" height="18" viewBox="0 0 20 18" fill="none">
    <path
      d="M10 17.5C9.7 17.5 9.4 17.4 9.14 17.2L1.5 10.5C0.53 9.58 0 8.33 0 7C0 4.24 2.24 2 5 2C6.9 2 8.57 3.11 9.4 4.7C9.54 4.88 9.76 5 10 5C10.24 5 10.46 4.88 10.6 4.7C11.43 3.11 13.1 2 15 2C17.76 2 20 4.24 20 7C20 8.33 19.47 9.58 18.5 10.5L10.86 17.2C10.6 17.4 10.3 17.5 10 17.5Z"
      fill="white"
    />
  </svg>
)

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { isOpen: isOverlayOpen } = useOverlayStore()
  const tgBackHandlerRef = useRef<(() => void) | null>(null)

  useTelegramSafeArea()

  const showNav = PAGES_WITH_NAV.includes(location.pathname) && !isOverlayOpen
  const showTgBack = !PAGES_WITH_NAV.includes(location.pathname)
  const isHome = location.pathname === '/'

  const [shownChildren, setShownChildren] = useState<React.ReactNode>(children)
  const [transClass, setTransClass] = useState<string>('')
  const shownPathRef = useRef(location.pathname)
  const shownKeyRef = useRef(location.key)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (location.key === shownKeyRef.current) return

    const fromPath = shownPathRef.current
    const toPath = location.pathname
    const newChildren = children
    const newKey = location.key

    setTransClass(getExitClass(fromPath, toPath))

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      shownPathRef.current = toPath
      shownKeyRef.current = newKey
      setShownChildren(newChildren)
      setTransClass(getEnterClass(fromPath, toPath))
    }, TRANSITION_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [location.key]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Portal into document.body guarantees position:fixed works regardless of
  // any ancestor transform/will-change that would otherwise break fixed children
  const homeHeader = isHome ? createPortal(
    <>
      <div className={homeStyles.topGradient} aria-hidden="true" />
      <header className={homeStyles.blueHeader}>
        <div className={homeStyles.logoBlock}>
          <img src="/logo.svg" alt="Yookie" className={`${homeStyles.logoImage} ${homeStyles.logoWhite}`} />
          <span className={`${homeStyles.logoSub} ${homeStyles.logoSubWhite}`}>Маркетплейс оффлайн услуг</span>
        </div>
        <button className={homeStyles.headerBtnBlue} onClick={() => navigate('/favorites')} aria-label="Избранное">
          <HeartIcon />
        </button>
      </header>
    </>,
    document.body
  ) : null

  return (
    <div className={styles.layout}>
      {homeHeader}
      <main className={`${styles.main} ${showNav ? styles.withNav : ''}`}>
        <div className={`${styles.pageTransition} ${transClass}`}>
          {shownChildren}
        </div>
      </main>
      {showNav && <BottomNav />}
    </div>
  )
}
