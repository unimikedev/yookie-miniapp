import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import styles from './AuthPage.module.css'

const GOOGLE_CLIENT_ID = '133260309518-kqgcacogqjrcmjbb8lh5k36el9mgth0a.apps.googleusercontent.com'

export default function AuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const authStore = useAuthStore()
  const returnTo = searchParams.get('return') || '/account'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const googleBtnRef = useRef<HTMLDivElement>(null)

  const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null
  const isInTelegram = !!tg?.initData

  // Redirect if already authenticated
  useEffect(() => {
    if (authStore.isAuthenticated) navigate(returnTo, { replace: true })
  }, [authStore.isAuthenticated])

  // Google Sign-In callback
  const handleGoogleCallback = useCallback(async (response: { credential: string }) => {
    setLoading(true)
    setError(null)
    try {
      await authStore.googleLogin(response.credential)
      navigate(returnTo, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа через Google')
      setLoading(false)
    }
  }, [returnTo])

  // Initialize Google Sign-In
  useEffect(() => {
    if (!googleBtnRef.current) return
    const initGoogle = () => {
      const google = (window as any).google
      if (!google?.accounts?.id) return
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
        auto_select: false,
      })
      google.accounts.id.renderButton(googleBtnRef.current!, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        width: googleBtnRef.current!.offsetWidth,
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'center',
      })
    }
    if ((window as any).google?.accounts?.id) {
      initGoogle()
    } else {
      const timer = setInterval(() => {
        if ((window as any).google?.accounts?.id) { clearInterval(timer); initGoogle() }
      }, 100)
      return () => clearInterval(timer)
    }
  }, [handleGoogleCallback])

  const handleTelegramLogin = async () => {
    const initData = tg?.initData as string | undefined
    if (!initData) {
      setError('Откройте приложение через Telegram.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await authStore.telegramLogin(initData)
      navigate(returnTo, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа. Попробуйте снова.')
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* Back */}
      <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Назад">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 4L6 10L12 16" />
        </svg>
      </button>

      {/* Logo */}
      <div className={styles.logoWrap}>
        <span className={styles.logoText}>Yookie</span>
        <span className={styles.logoDot}>.</span>
      </div>

      <div className={styles.content}>
        <h1 className={styles.title}>Добро пожаловать!</h1>
        <p className={styles.subtitle}>
          {isInTelegram
            ? 'Войдите одним нажатием через ваш аккаунт Telegram'
            : 'Войдите, чтобы записываться к мастерам'}
        </p>

        {error && <p className={styles.errorText}>{error}</p>}

        {/* Telegram one-tap login */}
        {isInTelegram && (
          <>
            <button
              className={styles.primaryBtn}
              onClick={handleTelegramLogin}
              disabled={loading}
            >
              <span className={styles.btnInner}>
                {loading ? (
                  <span className={styles.btnSpinner} />
                ) : (
                  /* Telegram logo */
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8-1.54 7.27c-.11.52-.42.65-.85.4l-2.36-1.74-1.14 1.1c-.13.13-.24.24-.49.24l.17-2.43 4.47-4.04c.19-.17-.04-.27-.3-.1L7.46 14.6l-2.3-.72c-.5-.16-.51-.5.1-.74l8.99-3.47c.42-.15.79.1.65.73z"/>
                  </svg>
                )}
                {loading ? 'Входим...' : 'Войти через Telegram'}
              </span>
            </button>

            <div className={styles.divider}>
              <span className={styles.dividerLine} />
              <span className={styles.dividerText}>или</span>
              <span className={styles.dividerLine} />
            </div>
          </>
        )}

        {/* Dev shortcut — only in local dev when not in Telegram */}
        {import.meta.env.DEV && !isInTelegram && (
          <button
            className={styles.primaryBtn}
            onClick={() => { authStore.devLogin(); navigate(returnTo, { replace: true }) }}
            style={{ marginBottom: 12 }}
          >
            Dev Login
          </button>
        )}

        <div ref={googleBtnRef} className={styles.googleBtn} />

        <p className={styles.agreement}>
          Продолжая, вы соглашаетесь с{' '}
          <a href="https://t.me/yookie_bot" target="_blank" rel="noopener noreferrer" className={styles.link}>
            условиями использования
          </a>
        </p>
      </div>
    </div>
  )
}
