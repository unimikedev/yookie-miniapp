import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useOverlayStore } from '@/stores/overlayStore'
import { useTelegramSafeArea } from '@/hooks/useTelegramSafeArea'
import { BottomNav } from '@/shared/ui'
import styles from './Layout.module.css'

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

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { isOpen: isOverlayOpen } = useOverlayStore()
  const tgBackHandlerRef = useRef<(() => void) | null>(null)

  useTelegramSafeArea()

  const isRestricted = (() => { try { return !!sessionStorage.getItem('yookie_restricted') } catch { return false } })()
  const showNav = PAGES_WITH_NAV.includes(location.pathname) && !isOverlayOpen && !isRestricted
  const showTgBack = !PAGES_WITH_NAV.includes(location.pathname) || isRestricted

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

    // Pro→Pro tab switches: skip Layout transition entirely so ProBottomNav stays fixed
    const skipTransition = fromPath.startsWith('/pro') && toPath.startsWith('/pro')

    if (skipTransition) {
      shownPathRef.current = toPath
      shownKeyRef.current = newKey
      setShownChildren(newChildren)
      setTransClass('')
      return
    }

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

  return (
    <div className={styles.layout}>
      <main className={`${styles.main} ${showNav ? styles.withNav : ''}`}>
        <div className={`${styles.pageTransition} ${transClass}`}>
          {shownChildren}
        </div>
      </main>
      <BottomNav visible={showNav} />
    </div>
  )
}
