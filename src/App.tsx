import { useState, useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { PlatformContextProvider } from '@/hooks/usePlatform'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Layout from '@/components/Layout'
import { Router } from '@/Router'
import { StartParamNavigator } from '@/components/StartParamNavigator'
import { MerchantRedirect } from '@/components/MerchantRedirect'
import SplashScreen from '@/components/SplashScreen'
import { useTelegramNotifications } from '@/hooks/useTelegramNotifications'
import { useThemeStore } from '@/stores/themeStore'
import { setLanguage } from '@/i18n'
import '@/shared/ui/tokens.css'
import '@/index.css'

const SPLASH_KEY = 'yookie_loaded'
const LANG_KEY = 'yookie_lang'

export default function App() {
  useTelegramNotifications()
  useThemeStore()

  // Re-detect language after mount — Telegram WebApp.initDataUnsafe may not be
  // populated at module-import time (when i18n initializes). Only applies when
  // no explicit user preference is stored.
  useEffect(() => {
    try {
      if (localStorage.getItem(LANG_KEY)) return
      const tgLang = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.language_code as string | undefined
      if (!tgLang) return
      const lang = tgLang.toLowerCase()
      if (lang.startsWith('uz')) setLanguage('uz')
      else if (lang.startsWith('en')) setLanguage('en')
      else if (lang.startsWith('ru')) setLanguage('ru')
    } catch { /* noop */ }
  }, [])

  const [showSplash] = useState(() => !sessionStorage.getItem(SPLASH_KEY))

  if (showSplash) {
    // Mark so it won't show again this session (after this render fires)
    sessionStorage.setItem(SPLASH_KEY, '1')
  }

  return (
    <ErrorBoundary>
      {showSplash && <SplashScreen />}
      <PlatformContextProvider>
        <BrowserRouter>
          <StartParamNavigator />
          <MerchantRedirect />
          <Layout>
            <Router />
          </Layout>
        </BrowserRouter>
      </PlatformContextProvider>
    </ErrorBoundary>
  )
}
