import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { listMyBusinesses } from '@/pro/api'

/**
 * Redirects merchants to /pro on app open if they set "default_app: pro" in bot settings.
 * Only fires once per session, only on the B2C root path (/), only when authenticated.
 */
export function MerchantRedirect() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const initStatus = useAuthStore(s => s.initStatus)
  const user = useAuthStore(s => s.user)
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    if (initStatus !== 'ready') return
    if (pathname !== '/') return
    if (!user?.businessId) return

    handled.current = true

    listMyBusinesses()
      .then((businesses) => {
        const primary = businesses[0]
        if (primary?.notification_config?.default_app === 'pro') {
          navigate('/pro', { replace: true })
        }
      })
      .catch(() => { /* noop — stay on B2C */ })
  }, [initStatus, user?.businessId, pathname])

  return null
}
