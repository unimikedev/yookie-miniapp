import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Handles Telegram Mini App deep links via initDataUnsafe.start_param.
 * Supported formats:
 *   b_<businessId>  → /business/<businessId>
 *   inv_<token>     → /invite/<token>
 *   pro_reg         → /auth?return=/pro/settings  (master onboarding)
 */
export function StartParamNavigator() {
  const navigate = useNavigate()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param
    if (!startParam) return

    handled.current = true

    if (startParam.startsWith('inv_')) {
      const token = startParam.slice(4)
      navigate(`/invite/${token}`, { replace: true })
    } else if (startParam.startsWith('b_')) {
      const businessId = startParam.slice(2)
      navigate(`/business/${businessId}`, { replace: true })
    } else if (startParam === 'pro_reg') {
      navigate('/auth?return=/pro/settings', { replace: true })
    }
  }, [navigate])

  return null
}
