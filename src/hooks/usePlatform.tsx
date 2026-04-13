import { createContext, useContext, useEffect, useState } from 'react'
import { PlatformContext, PlatformProvider, createPlatform } from '@/lib/platform'

const PlatformContextInstance = createContext<PlatformContext | null>(null)

export function usePlatform(): PlatformContext {
  const context = useContext(PlatformContextInstance)
  if (!context) {
    throw new Error('usePlatform must be used within PlatformContextProvider')
  }
  return context
}

interface PlatformProviderProps {
  children: React.ReactNode
}

let platformInstance: PlatformProvider | null = null

export function PlatformContextProvider({ children }: PlatformProviderProps) {
  const [context, setContext] = useState<PlatformContext | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function initializePlatform() {
      try {
        if (!platformInstance) {
          platformInstance = createPlatform()
        }

        const platformContext = await platformInstance.init()
        setContext(platformContext)

        platformInstance.ready()

        platformInstance.onThemeChanged(() => {
          setContext((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              theme: platformContext.theme === 'light' ? 'dark' : 'light',
            }
          })
        })
      } catch (error) {
        console.error('Failed to initialize platform:', error)
        const fallback: PlatformContext = {
          user: null,
          isReady: false,
          theme: 'light',
          colorScheme: {
            bg: '#ffffff',
            text: '#1a1a1a',
            hint: '#aeaeb2',
            link: '#7c3aed',
            button: '#7c3aed',
            buttonText: '#ffffff',
          },
          viewportHeight: window.innerHeight,
          viewportStableHeight: window.innerHeight,
          platform: 'web',
        }
        setContext(fallback)
      } finally {
        setIsLoading(false)
      }
    }

    initializePlatform()
  }, [])

  if (isLoading || !context) {
    return <div>Загрузка...</div>
  }

  return (
    <PlatformContextInstance.Provider value={context}>
      {children}
    </PlatformContextInstance.Provider>
  )
}
