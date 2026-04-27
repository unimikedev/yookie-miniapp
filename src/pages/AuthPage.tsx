import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { requestOtp } from '@/lib/api/auth'
import styles from './AuthPage.module.css'

const GOOGLE_CLIENT_ID = '133260309518-kqgcacogqjrcmjbb8lh5k36el9mgth0a.apps.googleusercontent.com'

type Screen = 'phone' | 'otp'
type ContactState = 'idle' | 'requesting' | 'ready' | 'declined'

const OTP_RESEND_SECONDS = 60

export default function AuthPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const authStore = useAuthStore()
  const returnTo = searchParams.get('return') || '/account'

  const [screen, setScreen] = useState<Screen>('phone')
  const [phone, setPhone] = useState('+998')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(OTP_RESEND_SECONDS)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contactState, setContactState] = useState<ContactState>('idle')

  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]
  const googleBtnRef = useRef<HTMLDivElement>(null)

  // Redirect if already authenticated
  useEffect(() => {
    if (authStore.isAuthenticated) navigate(returnTo, { replace: true })
  }, [authStore.isAuthenticated])

  // Request Telegram contact on mount to get verified phone
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (!tg?.requestContact) return
    setContactState('requesting')
    tg.requestContact((ok: boolean) => {
      if (ok) {
        const raw = tg.initDataUnsafe?.contact?.phone_number as string | undefined
        if (raw) {
          const digits = raw.replace(/\D/g, '')
          setPhone('+' + (digits.startsWith('998') ? digits : '998' + digits))
        }
        setContactState('ready')
      } else {
        setContactState('declined')
      }
    })
  }, [])

  // Google Sign-In callback
  const handleGoogleCallback = useCallback(async (response: { credential: string }) => {
    setIsLoading(true)
    setError(null)
    try {
      await authStore.googleLogin(response.credential)
      navigate(returnTo, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.errorGoogle'))
    } finally {
      setIsLoading(false)
    }
  }, [returnTo])

  // Initialize Google Sign-In
  useEffect(() => {
    if (screen !== 'phone' || !googleBtnRef.current) return

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

    // GSI may already be loaded or still loading
    if ((window as any).google?.accounts?.id) {
      initGoogle()
    } else {
      const timer = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          clearInterval(timer)
          initGoogle()
        }
      }, 100)
      return () => clearInterval(timer)
    }
  }, [screen, handleGoogleCallback])

  // Countdown timer for OTP resend
  useEffect(() => {
    if (screen !== 'otp') return
    setCountdown(OTP_RESEND_SECONDS)
    const interval = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [screen])

  const getTelegramInitData = (): string | undefined => {
    try {
      const raw = (window as any).Telegram?.WebApp?.initData
      return raw && raw.length > 0 ? raw : undefined
    } catch {
      return undefined
    }
  }

  const [otpViaTelegram, setOtpViaTelegram] = useState(false)

  const handleRequestOtp = async () => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 12) {
      setError(t('auth.errorPhone'))
      return
    }

    // Dev shortcuts: "admin" keyword OR +998 000 000 000 (9 zeros) — only in dev builds
    if (import.meta.env.DEV) {
      const isDevPhone = phone.trim().toLowerCase() === 'admin' || digits === '998000000000'
      if (isDevPhone) {
        authStore.devLogin()
        navigate(returnTo, { replace: true })
        return
      }
    }

    setIsLoading(true)
    setError(null)
    const initData = getTelegramInitData()
    setOtpViaTelegram(!!initData)
    try {
      await requestOtp(phone, initData)
      setScreen('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.errorSend'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpDigit = (idx: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[idx] = digit
    setOtp(next)
    setError(null)

    if (digit && idx < 5) {
      otpRefs[idx + 1].current?.focus()
    }

    // Auto-submit when all 6 digits entered
    if (digit && idx === 5 && next.every(d => d !== '')) {
      submitOtp(next.join(''))
    }
  }

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs[idx - 1].current?.focus()
    }
  }

  const submitOtp = async (code: string) => {
    if (code.length < 6) {
      setError(t('auth.errorCode'))
      return
    }
    // Dev shortcut: 000000 → instant test login — only in dev builds
    if (import.meta.env.DEV && code === '000000') {
      authStore.devLogin()
      navigate(returnTo, { replace: true })
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      await authStore.login(phone, code)
      navigate(returnTo, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.errorLogin'))
      setOtp(['', '', '', '', '', ''])
      otpRefs[0].current?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleNumpad = (digit: string) => {
    // Find first empty slot
    const idx = otp.findIndex(d => d === '')
    if (idx === -1) return
    handleOtpDigit(idx, digit)
  }

  const handleNumpadDelete = () => {
    // Find last filled slot
    const idx = [...otp].reverse().findIndex(d => d !== '')
    if (idx === -1) return
    const realIdx = 5 - idx
    const next = [...otp]
    next[realIdx] = ''
    setOtp(next)
    otpRefs[realIdx].current?.focus()
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setIsLoading(true)
    setError(null)
    setOtp(['', '', '', '', '', ''])
    const initData = getTelegramInitData()
    setOtpViaTelegram(!!initData)
    try {
      await requestOtp(phone, initData)
      setCountdown(OTP_RESEND_SECONDS)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.errorSend'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* Back button */}
      <button
        className={styles.backBtn}
        onClick={() => {
          if (screen === 'otp') { setScreen('phone'); setOtp(['', '', '', '', '', '']); setError(null) }
          else navigate(-1)
        }}
        aria-label={t('common.back')}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 4L6 10L12 16" />
        </svg>
      </button>

      {/* Logo */}
      <div className={styles.logoWrap}>
        <span className={styles.logoText}>Yookie</span>
        <span className={styles.logoDot}>.</span>
      </div>

      {screen === 'phone' ? (
        /* ── Phone screen ── */
        <div className={styles.content}>
          <h1 className={styles.title}>{t('auth.title')}</h1>
          <p className={styles.subtitle}>
            {contactState === 'requesting'
              ? 'Запрашиваем ваш номер из Telegram...'
              : contactState === 'ready'
              ? 'Номер подтверждён Telegram. Нажмите «Получить код».'
              : t('auth.subtitle')}
          </p>

          <div className={styles.phoneField}>
            <div className={styles.flagPrefix}>
              <span className={styles.flag}>🇺🇿</span>
              <span className={styles.code}>+998</span>
            </div>
            <input
              className={styles.phoneInput}
              type="tel"
              placeholder={contactState === 'requesting' ? '...' : t('auth.phonePlaceholder')}
              value={phone.replace(/^\+998/, '')}
              onChange={e => {
                if (contactState === 'ready') return
                const raw = e.target.value.replace(/\D/g, '').slice(0, 9)
                setPhone(`+998${raw}`)
                setError(null)
              }}
              disabled={isLoading || contactState === 'requesting'}
              readOnly={contactState === 'ready'}
              autoFocus={contactState === 'idle' || contactState === 'declined'}
            />
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <button
            className={styles.primaryBtn}
            onClick={handleRequestOtp}
            disabled={isLoading || contactState === 'requesting'}
          >
            {isLoading ? t('common.sending') : t('auth.getCode')}
          </button>

          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>{t('common.or')}</span>
            <span className={styles.dividerLine} />
          </div>

          <div ref={googleBtnRef} className={styles.googleBtn} />

          <p className={styles.agreement}>
            {t('auth.agree')}{' '}
            <a href="https://t.me/yookie_bot" target="_blank" rel="noopener noreferrer" className={styles.link}>{t('auth.terms')}</a>
          </p>
        </div>
      ) : (
        /* ── OTP screen ── */
        <div className={styles.content}>
          <h1 className={styles.title}>{t('auth.otpTitle')}</h1>
          <p className={styles.subtitle}>
            {otpViaTelegram
              ? <>{t('auth.otpSubtitleTelegramPre')} <strong>Telegram</strong> {t('auth.otpSubtitleAt')} <strong>{phone}</strong></>
              : <>{t('auth.otpSubtitleSmsPre')} <strong>{phone}</strong></>
            }
          </p>

          {/* OTP dots */}
          <div className={styles.otpRow}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={otpRefs[idx]}
                className={`${styles.otpBox} ${digit ? styles.otpBoxFilled : ''} ${error ? styles.otpBoxError : ''}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpDigit(idx, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(idx, e)}
                disabled={isLoading}
                readOnly
              />
            ))}
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          {/* Resend */}
          <div className={styles.resendRow}>
            {countdown > 0 ? (
              <p className={styles.resendTimer}>
                {t('auth.resendTimer', { seconds: countdown })}
              </p>
            ) : (
              <button className={styles.resendBtn} onClick={handleResend} disabled={isLoading}>
                {t('auth.resend')}
              </button>
            )}
          </div>

          {/* Custom numpad */}
          <div className={styles.numpad}>
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, i) => (
              <button
                key={i}
                className={`${styles.numpadKey} ${key === '' ? styles.numpadEmpty : ''}`}
                onClick={() => {
                  if (key === '⌫') handleNumpadDelete()
                  else if (key !== '') handleNumpad(key)
                }}
                disabled={key === '' || isLoading}
                aria-label={key === '⌫' ? t('common.delete') : key}
              >
                {key === '⌫' ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M7 4L2 10L7 16H18V4H7Z" /><path d="M11 7.5L15 12.5M15 7.5L11 12.5" />
                  </svg>
                ) : key}
              </button>
            ))}
          </div>

          <button
            className={styles.primaryBtn}
            onClick={() => submitOtp(otp.join(''))}
            disabled={isLoading || otp.some(d => !d)}
          >
            {isLoading ? t('common.checking') : t('auth.confirm')}
          </button>
        </div>
      )}
    </div>
  )
}
