import { BrowserRouter, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { PlatformContextProvider } from '@/hooks/usePlatform'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Layout from '@/components/Layout'
import { Router } from '@/Router'
import { StartParamNavigator } from '@/components/StartParamNavigator'
import { useTelegramNotifications } from '@/hooks/useTelegramNotifications'
import { useThemeStore } from '@/stores/themeStore'
import '@/shared/ui/tokens.css'
import '@/index.css'

// Page transition animation wrapper
function AnimatedRoutes() {
  const location = useLocation()
  const [prevLocation, setPrevLocation] = useState(location)
  const [direction, setDirection] = useState<'forward' | 'back' | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    if (prevLocation !== location && !isTransitioning) {
      // Determine direction based on path depth
      const prevDepth = prevLocation.pathname.split('/').filter(Boolean).length
      const currDepth = location.pathname.split('/').filter(Boolean).length
      
      if (currDepth > prevDepth) {
        setDirection('forward')
      } else if (currDepth < prevDepth) {
        setDirection('back')
      } else {
        setDirection('forward') // Same level, treat as forward
      }
      setPrevLocation(location)
      setIsTransitioning(true)
      
      // Reset transition state after animation completes
      setTimeout(() => {
        setIsTransitioning(false)
        setDirection(null)
      }, 420) // 280ms * 1.5 = 420ms
    }
  }, [location, prevLocation, isTransitioning])

  return (
    <div 
      className={`page-transition ${direction || ''}`}
      key={location.pathname}
    >
      <Router />
    </div>
  )
}

export default function App() {
  // Подключаем уведомления от Telegram Bot API
  useTelegramNotifications();

  // Initialize theme from store
  useThemeStore()

  return (
    <ErrorBoundary>
      <PlatformContextProvider>
        <BrowserRouter>
          <StartParamNavigator />
          <Layout>
            <AnimatedRoutes />
          </Layout>
        </BrowserRouter>
      </PlatformContextProvider>
    </ErrorBoundary>
  )
}
