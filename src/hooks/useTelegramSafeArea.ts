/**
 * useTelegramSafeArea — reads safe area insets directly from the Telegram
 * WebApp API and writes them as CSS custom properties on :root.
 *
 * Telegram provides two inset objects:
 *   safeAreaInset        — system-level (status bar, home indicator, notch)
 *   contentSafeAreaInset — Telegram UI (header bar, bottom navigation)
 *
 * In fullscreen mode both are non-zero and stack.
 * In non-fullscreen (default panel) safeAreaInset is all zeros.
 *
 * We combine them so CSS always has the correct total to pad by, regardless
 * of which mode the Mini App is opened in.
 *
 * CSS vars written (override the env() fallbacks in index.css):
 *   --safe-area-top
 *   --safe-area-bottom
 *   --safe-area-left
 *   --safe-area-right
 *
 * Call once in Layout — applies globally.
 */

import { useEffect } from 'react'

interface TgInset { top: number; bottom: number; left: number; right: number }

function getInsets(): { safe: TgInset; content: TgInset } {
  const tg = (window as any).Telegram?.WebApp
  const zero: TgInset = { top: 0, bottom: 0, left: 0, right: 0 }
  return {
    safe:    tg?.safeAreaInset        ?? zero,
    content: tg?.contentSafeAreaInset ?? zero,
  }
}

function applyInsets() {
  const { safe, content } = getInsets()
  const el = document.documentElement

  el.style.setProperty('--safe-area-top',    `${safe.top    + content.top}px`)
  el.style.setProperty('--safe-area-bottom',  `${safe.bottom + content.bottom}px`)
  el.style.setProperty('--safe-area-left',    `${safe.left   + content.left}px`)
  el.style.setProperty('--safe-area-right',   `${safe.right  + content.right}px`)
}

export function useTelegramSafeArea(): void {
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp

    // Expand to full panel height (non-fullscreen)
    tg?.expand?.()

    // Apply immediately — Telegram populates insets synchronously by now
    applyInsets()

    if (!tg) return

    // Re-apply whenever the mode or device orientation changes
    tg.onEvent('safeAreaChanged',        applyInsets)
    tg.onEvent('contentSafeAreaChanged', applyInsets)

    return () => {
      tg.offEvent('safeAreaChanged',        applyInsets)
      tg.offEvent('contentSafeAreaChanged', applyInsets)
    }
  }, [])
}
