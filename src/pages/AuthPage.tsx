import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { requestOtp } from '@/lib/api/auth'
import styles from './AuthPage.module.css'

type Screen = 'phone' | 'otp'

const OTP_RESEND_SECONDS = 60

export default function AuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const authStore = useAuthStore()
  const returnTo = searchParams.get('return') || '/account'

  const [screen, setScreen] = useState<Screen>('phone')
  const [phone, setPhone] = useState('+998')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(OTP_RESEND_SECONDS)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  // Redirect if already authenticated
  useEffect(() => {
    if (authStore.isAuthenticated) navigate(returnTo, { replace: true })
  }, [authStore.isAuthenticated])

  // Countdown timer for OTP resend
  useEffect(() => {
    if (screen !== 'otp') return
    setCountdown(OTP_RESEND_SECONDS)
    const interval = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [screen])

  const handleRequestOtp = async () => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 12) {
      setError('Введите полный номер телефона')
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
    try {
      await requestOtp(phone)
      setScreen('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при отправке кода')
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
      setError('Введите 6-значный код')
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
      setError(err instanceof Error ? err.message : 'Неверный код')
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
    try {
      await requestOtp(phone)
      setCountdown(OTP_RESEND_SECONDS)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при отправке кода')
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
        aria-label="Назад"
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
          <h1 className={styles.title}>Вход в аккаунт</h1>
          <p className={styles.subtitle}>Введите номер телефона для входа или регистрации</p>

          <div className={styles.phoneField}>
            <div className={styles.flagPrefix}>
              <span className={styles.flag}>🇺🇿</span>
              <span className={styles.code}>+998</span>
            </div>
            <input
              className={styles.phoneInput}
              type="tel"
              placeholder="90 123 45 67"
              value={phone.replace(/^\+998/, '')}
              onChange={e => {
                const raw = e.target.value.replace(/\D/g, '').slice(0, 9)
                setPhone(`+998${raw}`)
                setError(null)
              }}
              disabled={isLoading}
              autoFocus
            />
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <button
            className={styles.primaryBtn}
            onClick={handleRequestOtp}
            disabled={isLoading}
          >
            {isLoading ? 'Отправка...' : 'Получить код →'}
          </button>

          <p className={styles.agreement}>
            Продолжая, вы соглашаетесь с{' '}
            <a href="https://t.me/yookie_bot" target="_blank" rel="noopener noreferrer" className={styles.link}>условиями использования</a>
          </p>
        </div>
      ) : (
        /* ── OTP screen ── */
        <div className={styles.content}>
          <h1 className={styles.title}>Введите код</h1>
          <p className={styles.subtitle}>
            Мы отправили 6-значный код на{' '}
            <strong>{phone}</strong>
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
                Отправить снова через <strong>{countdown}с</strong>
              </p>
            ) : (
              <button className={styles.resendBtn} onClick={handleResend} disabled={isLoading}>
                Отправить снова
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
                aria-label={key === '⌫' ? 'Удалить' : key}
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
            {isLoading ? 'Проверка...' : 'Подтвердить'}
          </button>
        </div>
      )}
    </div>
  )
}
