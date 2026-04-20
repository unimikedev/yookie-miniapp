import { BrowserRouter } from 'react-router-dom'
import { PlatformContextProvider } from '@/hooks/usePlatform'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Layout from '@/components/Layout'
import { Router } from '@/Router'
import { useTelegramNotifications } from '@/hooks/useTelegramNotifications'
import PageTransitionWrapper from '@/components/PageTransitionWrapper'
import '@/shared/ui/tokens.css'
import '@/index.css'

export default function App() {
  // Подключаем уведомления от Telegram Bot API
  useTelegramNotifications();

  return (
    <ErrorBoundary>
      <PlatformContextProvider>
        <BrowserRouter>
          <Layout>
            <PageTransitionWrapper>
              <Router />
            </PageTransitionWrapper>
          </Layout>
        </BrowserRouter>
      </PlatformContextProvider>
    </ErrorBoundary>
  )
}
