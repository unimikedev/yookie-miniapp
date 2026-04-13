/**
 * Hook to integrate Telegram WebApp BackButton with react-router navigation.
 * Shows the native Telegram back button and maps it to router.goBack().
 * Hides the button when the component unmounts.
 */

import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlatform } from './usePlatform'

export function useTelegramBackButton(enabled: boolean = true): void {
  const navigate = useNavigate()
  const platform = usePlatform()
  const handlerRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!enabled) return

    // Only activate Telegram BackButton when running inside Telegram
    const webApp = (platform as any).getWebApp?.()
    if (!webApp) return

    handlerRef.current = () => {
      navigate(-1)
    }

    webApp.BackButton.onClick(handlerRef.current)
    webApp.BackButton.show()

    return () => {
      if (handlerRef.current) {
        webApp.BackButton.offClick(handlerRef.current)
      }
      webApp.BackButton.hide()
    }
  }, [enabled, navigate, platform])
}
