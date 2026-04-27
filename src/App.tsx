import { useState } from 'react'
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
import '@/shared/ui/tokens.css'
import '@/index.css'

const SPLASH_KEY = 'yookie_loaded'

export default function App() {
  useTelegramNotifications()
  useThemeStore()

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
