/**
 * Hook to integrate Telegram WebApp MainButton with the app state.
 * Shows the native Telegram bottom button (replaces inline CTA).
 * Automatically hides on unmount.
 */

import { useEffect, useRef } from 'react'
import { usePlatform } from './usePlatform'

interface UseMainButtonOptions {
  /** Whether to show the MainButton */
  enabled?: boolean
  /** Button text */
  text: string
  /** Click handler */
  onClick: () => void
  /** Whether the button is disabled */
  disabled?: boolean
  /** Whether to show a loading spinner */
  loading?: boolean
}

export function useTelegramMainButton(options: UseMainButtonOptions): void {
  const platform = usePlatform()
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    if (!options.enabled) return

    const webApp = (platform as any).getWebApp?.()
    if (!webApp) return

    const handleClick = () => {
      optionsRef.current.onClick()
    }

    webApp.MainButton.offClick(() => {})
    webApp.MainButton.setText(options.text)
    webApp.MainButton.onClick(handleClick)

    if (options.disabled) {
      webApp.MainButton.disable()
    } else {
      webApp.MainButton.enable()
    }

    if (options.loading) {
      webApp.MainButton.showProgress()
    } else {
      webApp.MainButton.hideProgress()
    }

    webApp.MainButton.show()

    return () => {
      webApp.MainButton.offClick(() => {})
      webApp.MainButton.hide()
    }
  }, [options.enabled, options.text, options.disabled, options.loading, platform])
}
