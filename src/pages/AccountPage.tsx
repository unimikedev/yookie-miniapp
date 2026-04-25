import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { usePlatform } from '@/hooks/usePlatform'
import { useThemeStore } from '@/stores/themeStore'
import { useAuthStore } from '@/stores/authStore'
import { useCityStore } from '@/stores/cityStore'
import { fetchClientStats } from '@/lib/api/clients'
import CitySelector from '@/components/features/CitySelector'
import LanguageSwitcher from '@/components/features/LanguageSwitcher'
import styles from './AccountPage.module.css'

const SUPPORT_URL = 'https://t.me/yookie_bot'

const ChevronRight = () => (
  <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
    <path d="M4.6 6L0 1.4L1.4 0L7.4 6L1.4 12L0 10.6L4.6 6Z" fill="#6B7280"/>
  </svg>
)

// Icons — sky blue accent color matching design filter
const IconBookings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M18 1.25C18.41 1.25 18.75 1.59 18.75 2V2.64C19.55 2.86 20.23 3.23 20.8 3.84C21.53 4.64 21.88 5.62 22.06 6.85C22.23 8.05 22.25 9.58 22.25 11.5C22.25 11.91 21.92 12.25 21.5 12.25C21.09 12.25 20.75 11.92 20.75 11.5C20.75 10.43 20.74 9.53 20.71 8.75H3.29C3.25 9.71 3.25 10.85 3.25 12.24V12.76C3.25 14.96 3.25 16.53 3.4 17.74C3.55 18.92 3.83 19.62 4.3 20.14C4.75 20.62 5.34 20.91 6.32 21.07C7.33 21.23 8.65 21.25 10.5 21.25C10.91 21.25 11.25 21.59 11.25 22C11.25 22.41 10.91 22.75 10.5 22.75C8.68 22.75 7.23 22.73 6.08 22.55C4.9 22.35 3.95 21.96 3.2 21.16C2.42 20.31 2.08 19.25 1.91 17.92C1.75 16.62 1.75 14.94 1.75 12.81V12.19C1.75 10.06 1.75 8.38 1.91 7.08C2.08 5.75 2.42 4.69 3.2 3.84C3.77 3.23 4.45 2.86 5.25 2.64V2C5.25 1.59 5.59 1.25 6 1.25C6.41 1.25 6.75 1.59 6.75 2V2.37C7.89 2.25 9.28 2.25 10.99 2.25H13.01C14.72 2.25 16.11 2.25 17.25 2.37V2C17.25 1.59 17.59 1.25 18 1.25Z" fill="#6BCEFF"/>
  </svg>
)

const IconFavorite = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 21C11.7 21 11.4 20.9 11.14 20.7L3.5 14C2.53 13.08 2 11.83 2 10.5C2 7.74 4.24 5.5 7 5.5C8.9 5.5 10.57 6.61 11.4 8.2C11.54 8.38 11.76 8.5 12 8.5C12.24 8.5 12.46 8.38 12.6 8.2C13.43 6.61 15.1 5.5 17 5.5C19.76 5.5 22 7.74 22 10.5C22 11.83 21.47 13.08 20.5 14L12.86 20.7C12.6 20.9 12.3 21 12 21Z" fill="#6BCEFF"/>
  </svg>
)

const IconPromo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M21.41 11.58L12.41 2.58C12.05 2.22 11.55 2 11 2H4C2.9 2 2 2.9 2 4V11C2 11.55 2.22 12.05 2.59 12.42L11.59 21.42C11.95 21.78 12.45 22 13 22C13.55 22 14.05 21.78 14.41 21.41L21.41 14.41C21.78 14.05 22 13.55 22 13C22 12.45 21.77 11.94 21.41 11.58ZM5.5 7C4.67 7 4 6.33 4 5.5C4 4.67 4.67 4 5.5 4C6.33 4 7 4.67 7 5.5C7 6.33 6.33 7 5.5 7Z" fill="#6BCEFF"/>
  </svg>
)

const IconPayment = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M20 4H4C2.89 4 2 4.89 2 6V18C2 19.11 2.89 20 4 20H20C21.11 20 22 19.11 22 18V6C22 4.89 21.11 4 20 4ZM20 18H4V12H20V18ZM20 8H4V6H20V8Z" fill="#6BCEFF"/>
  </svg>
)

const IconCity = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#6BCEFF"/>
  </svg>
)

const IconSupport = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 2C16.2 2 19.87 4.89 20 8.8C20.1 8.85 20.21 8.91 20.31 8.98L21.97 10.08C22.46 10.41 22.75 10.95 22.75 11.54V14.47C22.75 15.05 22.46 15.6 21.97 15.92L20.31 17.03C20.21 17.1 20.11 17.15 20 17.21V19C20 20.66 18.66 22 17 22H12C11.45 22 11 21.55 11 21C11 20.45 11.45 20 12 20H17C17.55 20 18 19.55 18 19V17.32C17.9 17.28 17.79 17.24 17.69 17.19C16.81 16.75 16.25 15.84 16.25 14.85V11.15C16.25 10.16 16.81 9.26 17.69 8.81C17.79 8.77 17.89 8.73 17.99 8.69C17.8 6.19 15.33 4 12 4C8.67 4 6.2 6.19 6.01 8.69C6.11 8.73 6.21 8.77 6.31 8.81C7.19 9.26 7.75 10.16 7.75 11.15V14.85C7.75 15.84 7.19 16.75 6.31 17.19C5.47 17.61 4.47 17.55 3.69 17.03L2.03 15.92C1.54 15.6 1.25 15.05 1.25 14.47V11.54C1.25 10.95 1.54 10.41 2.03 10.08L3.69 8.98C3.79 8.91 3.9 8.85 4 8.8C4.13 4.89 7.8 2 12 2Z" fill="#6BCEFF"/>
  </svg>
)

const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M19.14 12.94C19.18 12.64 19.2 12.33 19.2 12C19.2 11.68 19.18 11.36 19.13 11.06L21.16 9.48C21.34 9.34 21.39 9.07 21.28 8.87L19.36 5.55C19.24 5.33 18.99 5.26 18.77 5.33L16.38 6.29C15.88 5.91 15.35 5.59 14.76 5.35L14.4 2.81C14.36 2.57 14.16 2.4 13.92 2.4H10.08C9.84 2.4 9.65 2.57 9.61 2.81L9.25 5.35C8.66 5.59 8.12 5.92 7.63 6.29L5.24 5.33C5.02 5.25 4.77 5.33 4.65 5.55L2.74 8.87C2.62 9.08 2.66 9.34 2.86 9.48L4.89 11.06C4.84 11.36 4.8 11.69 4.8 12C4.8 12.31 4.82 12.64 4.87 12.94L2.84 14.52C2.66 14.66 2.61 14.93 2.72 15.13L4.64 18.45C4.76 18.67 5.01 18.74 5.23 18.67L7.62 17.71C8.12 18.09 8.65 18.41 9.24 18.65L9.6 21.19C9.65 21.43 9.84 21.6 10.08 21.6H13.92C14.16 21.6 14.36 21.43 14.39 21.19L14.75 18.65C15.34 18.41 15.88 18.09 16.37 17.71L18.76 18.67C18.98 18.75 19.23 18.67 19.35 18.45L21.27 15.13C21.39 14.91 21.34 14.66 21.15 14.52L19.14 12.94ZM12 15.6C10.02 15.6 8.4 13.98 8.4 12C8.4 10.02 10.02 8.4 12 8.4C13.98 8.4 15.6 10.02 15.6 12C15.6 13.98 13.98 15.6 12 15.6Z" fill="#6BCEFF"/>
  </svg>
)

const IconSun = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 2V4M12 20V22M4 12H2M22 12H20M19.07 4.93L17.66 6.34M6.34 17.66L4.93 19.07M19.07 19.07L17.66 17.66M6.34 6.34L4.93 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const IconMoon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconPro = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L2 7V17L12 22L22 17V7L12 2ZM12 4.18L19.39 8L12 11.82L4.61 8L12 4.18ZM4 9.57L11 13.18V19.43L4 15.82V9.57ZM13 19.43V13.18L20 9.57V15.82L13 19.43Z" fill="#6BCEFF"/>
  </svg>
)

const IconLogout = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12.85 2C13.37 2 13.88 2.04 14.39 2.1C14.93 2.18 15.32 2.68 15.24 3.23C15.17 3.78 14.66 4.16 14.11 4.09C13.7 4.03 13.28 4 12.85 4C8.04 4 4.25 7.64 4.25 12C4.25 16.36 8.04 20 12.85 20C13.28 20 13.7 19.97 14.11 19.91C14.66 19.84 15.17 20.22 15.24 20.77C15.32 21.32 14.93 21.82 14.39 21.9C13.88 21.96 13.37 22 12.85 22C7.06 22 2.25 17.58 2.25 12C2.25 6.42 7.06 2 12.85 2ZM17.93 8.86C18.49 8.59 18.99 8.89 19.1 8.96L19.57 9.29C19.95 9.59 20.46 9.99 20.85 10.38C21.05 10.57 21.25 10.78 21.41 11.01C21.55 11.22 21.75 11.57 21.75 12C21.75 12.43 21.55 12.78 21.41 12.99C21.25 13.22 21.05 13.43 20.85 13.62C20.46 14 19.95 14.41 19.57 14.71L19.1 15.04C18.99 15.11 18.49 15.41 17.93 15.14C17.36 14.86 17.29 14.29 17.27 14.16C17.25 13.98 17.25 13.76 17.25 13.59V13.01H10.75C10.2 13.01 9.75 12.56 9.75 12.01C9.75 11.45 10.2 11.01 10.75 11.01H17.25V10.41C17.25 10.24 17.25 10.02 17.27 9.84C17.29 9.71 17.36 9.14 17.93 8.86Z" fill="#F87171"/>
  </svg>
)

export default function AccountPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const platform = usePlatform()
  const themeStore = useThemeStore()
  const authStore = useAuthStore()
  const { city } = useCityStore()
  const user = platform.user

  const [citySelectorOpen, setCitySelectorOpen] = useState(false)
  const [stats, setStats] = useState<{ joinDays: number }>({ joinDays: 0 })

  useEffect(() => {
    if (!authStore.isAuthenticated) return
    const phone = authStore.phone
    if (!phone) return
    let cancelled = false
    fetchClientStats(phone)
      .then((data) => {
        if (cancelled) return
        const joinedAt = new Date(data.joinedAt)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - joinedAt.getTime())
        setStats({ joinDays: Math.ceil(diffTime / (1000 * 60 * 60 * 24)) })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [authStore.phone, authStore.isAuthenticated])

  /* ── Guest screen ─────────────────────────────────────────────── */
  if (!authStore.isAuthenticated) {
    return (
      <div className={styles.page}>
        <div className={styles.content}>
          <div className={styles.profileSection}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatar}>
                <div className={styles.avatarFallback}>?</div>
              </div>
            </div>
            <h1 className={styles.userName}>{t('account.guestTitle')}</h1>
            <p className={styles.userSub}>{t('account.guestSubtitle')}</p>
            <button
              className={styles.loginCTA}
              onClick={() => navigate('/auth?return=/account')}
            >
              {t('account.loginCTA')}
            </button>
          </div>

          <div className={styles.menuList}>
            <button className={styles.menuItem} onClick={() => setCitySelectorOpen(true)}>
              <div className={styles.menuItemLeft}>
                <div className={styles.menuIconWrap}><IconCity /></div>
                <span className={styles.menuLabel}>{t('account.city')}</span>
              </div>
              <div className={styles.menuItemRight}>
                <span className={styles.menuHint}>{city.name}</span>
                <ChevronRight />
              </div>
            </button>
            <button className={styles.menuItem} onClick={() => window.open(SUPPORT_URL, '_blank')}>
              <div className={styles.menuItemLeft}>
                <div className={styles.menuIconWrap}><IconSupport /></div>
                <span className={styles.menuLabel}>{t('account.support')}</span>
              </div>
              <div className={styles.menuItemRight}><ChevronRight /></div>
            </button>
            <button className={styles.menuItem} onClick={() => themeStore.toggle()}>
              <div className={styles.menuItemLeft}>
                <div className={styles.menuIconWrap}>
                  {themeStore.theme === 'light' ? <IconSun /> : <IconMoon />}
                </div>
                <span className={styles.menuLabel}>{t('account.theme')}</span>
              </div>
              <div className={styles.menuItemRight}>
                <span className={styles.menuHint}>{themeStore.theme === 'light' ? t('account.themeLight') : t('account.themeDark')}</span>
                <ChevronRight />
              </div>
            </button>
          </div>
        </div>
        <CitySelector open={citySelectorOpen} onClose={() => setCitySelectorOpen(false)} />
      </div>
    )
  }

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
  const initials = ((user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')).toUpperCase()

  return (
    <div className={styles.page}>
      <div className={styles.content}>

        {/* Profile header */}
        <div className={styles.profileSection}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>
              {user?.photoUrl
                ? <img src={user.photoUrl} alt="avatar" className={styles.avatarImg} />
                : <div className={styles.avatarFallback}>{initials || 'А'}</div>
              }
            </div>
          </div>
          <h1 className={styles.userName}>{displayName || t('account.profile')}</h1>
          {user?.username && <p className={styles.userPhone}>@{user.username}</p>}
          <p className={styles.userSub}>{t('account.thankYou', { days: stats.joinDays || '—' })}</p>
        </div>

        {/* Menu list — card style per design spec */}
        <div className={styles.menuList}>

          <button className={styles.menuItem} onClick={() => navigate('/my-bookings')}>
            <div className={styles.menuItemLeft}>
              <div className={styles.menuIconWrap}><IconBookings /></div>
              <span className={styles.menuLabel}>{t('account.myBookings')}</span>
            </div>
            <div className={styles.menuItemRight}><ChevronRight /></div>
          </button>

          <button className={styles.menuItem} onClick={() => navigate('/favorites')}>
            <div className={styles.menuItemLeft}>
              <div className={styles.menuIconWrap}><IconFavorite /></div>
              <span className={styles.menuLabel}>{t('account.favorites')}</span>
            </div>
            <div className={styles.menuItemRight}><ChevronRight /></div>
          </button>

          <button className={`${styles.menuItem} ${styles.menuItemDisabled}`} onClick={() => {}}>
            <div className={styles.menuItemLeft}>
              <div className={styles.menuIconWrap}><IconPromo /></div>
              <span className={styles.menuLabel}>{t('account.promo')}</span>
            </div>
            <div className={styles.menuItemRight}>
              <span className={styles.menuHint}>{t('common.soon')}</span>
            </div>
          </button>

          <button className={`${styles.menuItem} ${styles.menuItemDisabled}`} onClick={() => {}}>
            <div className={styles.menuItemLeft}>
              <div className={styles.menuIconWrap}><IconPayment /></div>
              <span className={styles.menuLabel}>{t('account.payments')}</span>
            </div>
            <div className={styles.menuItemRight}>
              <span className={styles.menuHint}>{t('common.soon')}</span>
            </div>
          </button>

          <button className={styles.menuItem} onClick={() => setCitySelectorOpen(true)}>
            <div className={styles.menuItemLeft}>
              <div className={styles.menuIconWrap}><IconCity /></div>
              <span className={styles.menuLabel}>{t('account.city')}</span>
            </div>
            <div className={styles.menuItemRight}>
              <span className={styles.menuHint}>{city.name}</span>
              <ChevronRight />
            </div>
          </button>

          <button className={styles.menuItem} onClick={() => window.open(SUPPORT_URL, '_blank')}>
            <div className={styles.menuItemLeft}>
              <div className={styles.menuIconWrap}><IconSupport /></div>
              <span className={styles.menuLabel}>{t('account.support')}</span>
            </div>
            <div className={styles.menuItemRight}><ChevronRight /></div>
          </button>

          <button className={styles.menuItem} onClick={() => navigate('/profile/edit')}>
            <div className={styles.menuItemLeft}>
              <div className={styles.menuIconWrap}><IconSettings /></div>
              <span className={styles.menuLabel}>{t('account.settings')}</span>
            </div>
            <div className={styles.menuItemRight}><ChevronRight /></div>
          </button>

        </div>

        {/* Secondary section: Pro + theme + logout */}
        <div className={styles.menuList}>

          <button className={styles.menuItem} onClick={() => navigate('/pro')}>
            <div className={styles.menuItemLeft}>
              <div className={styles.menuIconWrap}><IconPro /></div>
              <span className={styles.menuLabel}>{t('account.yookiePro')}</span>
            </div>
            <div className={styles.menuItemRight}><ChevronRight /></div>
          </button>

          <button className={styles.menuItem} onClick={() => themeStore.toggle()}>
            <div className={styles.menuItemLeft}>
              <div className={styles.menuIconWrap}>
                {themeStore.theme === 'light' ? <IconSun /> : <IconMoon />}
              </div>
              <span className={styles.menuLabel}>{t('account.theme')}</span>
            </div>
            <div className={styles.menuItemRight}>
              <span className={styles.menuHint}>{themeStore.theme === 'light' ? t('account.themeLight') : t('account.themeDark')}</span>
              <ChevronRight />
            </div>
          </button>

          <div className={styles.menuItem}>
            <div className={styles.menuItemLeft}>
              <span className={styles.menuLabel}>{t('account.language')}</span>
            </div>
            <div className={styles.menuItemRight}>
              <LanguageSwitcher compact />
            </div>
          </div>

          <button className={styles.menuItem} onClick={() => { authStore.logout(); navigate('/') }}>
            <div className={styles.menuItemLeft}>
              <div className={styles.menuIconWrap}><IconLogout /></div>
              <span className={`${styles.menuLabel} ${styles.menuLabelDanger}`}>{t('account.logout')}</span>
            </div>
            <div className={styles.menuItemRight}><ChevronRight /></div>
          </button>

        </div>

      </div>

      <CitySelector open={citySelectorOpen} onClose={() => setCitySelectorOpen(false)} />
    </div>
  )
}
