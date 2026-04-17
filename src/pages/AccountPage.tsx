import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { usePlatform } from '@/hooks/usePlatform'
import { useThemeStore } from '@/stores/themeStore'
import { useAuthStore } from '@/stores/authStore'
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton'
import { fetchClientStats } from '@/lib/api/clients'
import styles from './AccountPage.module.css'

const SUPPORT_URL = 'https://t.me/yookie_bot'

const ChevronRight = ({ color = '#303235' }: { color?: string }) => (
  <svg width="8" height="12" viewBox="0 0 8 12" fill="none"><path d="M4.6 6L0 1.4L1.4 0L7.4 6L1.4 12L0 10.6L4.6 6Z" fill={color}/></svg>
)

const menuItems = [
  {
    id: 'pro',
    label: 'Yookie Pro',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7V17L12 22L22 17V7L12 2ZM12 4.18L19.39 8L12 11.82L4.61 8L12 4.18ZM4 9.57L11 13.18V19.43L4 15.82V9.57ZM13 19.43V13.18L20 9.57V15.82L13 19.43Z" fill="#6BCEFF"/></svg>
    ),
    path: '/pro',
    danger: false,
  },
  {
    id: 'edit',
    label: 'Редактировать профиль',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C20.98 6.77 20.98 6.33 20.71 6.06L17.94 3.29C17.67 3.02 17.23 3.02 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="#6B7280"/></svg>
    ),
    path: '/profile/edit',
    danger: false,
  },
  {
    id: 'history',
    label: 'История бронирований',
    icon: (
      <svg width="21" height="22" viewBox="0 0 24 24" fill="none"><path d="M18 1.25C18.41 1.25 18.75 1.59 18.75 2V2.64C19.55 2.86 20.23 3.23 20.8 3.84C21.53 4.64 21.88 5.62 22.06 6.85C22.23 8.05 22.25 9.58 22.25 11.5C22.25 11.91 21.92 12.25 21.5 12.25C21.09 12.25 20.75 11.92 20.75 11.5C20.75 10.43 20.74 9.53 20.71 8.75H3.29C3.25 9.71 3.25 10.85 3.25 12.24V12.76C3.25 14.96 3.25 16.53 3.4 17.74C3.55 18.92 3.83 19.62 4.3 20.14C4.75 20.62 5.34 20.91 6.32 21.07C7.33 21.23 8.65 21.25 10.5 21.25C10.91 21.25 11.25 21.59 11.25 22C11.25 22.41 10.91 22.75 10.5 22.75C8.68 22.75 7.23 22.73 6.08 22.55C4.9 22.35 3.95 21.96 3.2 21.16C2.42 20.31 2.08 19.25 1.91 17.92C1.75 16.62 1.75 14.94 1.75 12.81V12.19C1.75 10.06 1.75 8.38 1.91 7.08C2.08 5.75 2.42 4.69 3.2 3.84C3.77 3.23 4.45 2.86 5.25 2.64V2C5.25 1.59 5.59 1.25 6 1.25C6.41 1.25 6.75 1.59 6.75 2V2.37C7.89 2.25 9.28 2.25 10.99 2.25H13.01C14.72 2.25 16.11 2.25 17.25 2.37V2C17.25 1.59 17.59 1.25 18 1.25Z" fill="#6B7280"/></svg>
    ),
    path: '/my-bookings',
    danger: false,
  },
  {
    id: 'support',
    label: 'Поддержка',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C16.2 2 19.87 4.89 20 8.8C20.1 8.85 20.21 8.91 20.31 8.98L21.97 10.08C22.46 10.41 22.75 10.95 22.75 11.54V14.47C22.75 15.05 22.46 15.6 21.97 15.92L20.31 17.03C20.21 17.1 20.11 17.15 20 17.21V19C20 20.66 18.66 22 17 22H12C11.45 22 11 21.55 11 21C11 20.45 11.45 20 12 20H17C17.55 20 18 19.55 18 19V17.32C17.9 17.28 17.79 17.24 17.69 17.19C16.81 16.75 16.25 15.84 16.25 14.85V11.15C16.25 10.16 16.81 9.26 17.69 8.81C17.79 8.77 17.89 8.73 17.99 8.69C17.8 6.19 15.33 4 12 4C8.67 4 6.2 6.19 6.01 8.69C6.11 8.73 6.21 8.77 6.31 8.81C7.19 9.26 7.75 10.16 7.75 11.15V14.85C7.75 15.84 7.19 16.75 6.31 17.19C5.47 17.61 4.47 17.55 3.69 17.03L2.03 15.92C1.54 15.6 1.25 15.05 1.25 14.47V11.54C1.25 10.95 1.54 10.41 2.03 10.08L3.69 8.98C3.79 8.91 3.9 8.85 4 8.8C4.13 4.89 7.8 2 12 2Z" fill="#6B7280"/></svg>
    ),
    action: 'support' as const,
    danger: false,
  },
  {
    id: 'logout',
    label: 'Выйти',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12.85 2C13.37 2 13.88 2.04 14.39 2.1C14.93 2.18 15.32 2.68 15.24 3.23C15.17 3.78 14.66 4.16 14.11 4.09C13.7 4.03 13.28 4 12.85 4C8.04 4 4.25 7.64 4.25 12C4.25 16.36 8.04 20 12.85 20C13.28 20 13.7 19.97 14.11 19.91C14.66 19.84 15.17 20.22 15.24 20.77C15.32 21.32 14.93 21.82 14.39 21.9C13.88 21.96 13.37 22 12.85 22C7.06 22 2.25 17.58 2.25 12C2.25 6.42 7.06 2 12.85 2ZM17.93 8.86C18.49 8.59 18.99 8.89 19.1 8.96L19.57 9.29C19.95 9.59 20.46 9.99 20.85 10.38C21.05 10.57 21.25 10.78 21.41 11.01C21.55 11.22 21.75 11.57 21.75 12C21.75 12.43 21.55 12.78 21.41 12.99C21.25 13.22 21.05 13.43 20.85 13.62C20.46 14 19.95 14.41 19.57 14.71L19.1 15.04C18.99 15.11 18.49 15.41 17.93 15.14C17.36 14.86 17.29 14.29 17.27 14.16L17.27 14.16C17.25 13.98 17.25 13.76 17.25 13.59V13.01H10.75C10.2 13.01 9.75 12.56 9.75 12.01C9.75 11.45 10.2 11.01 10.75 11.01H17.25V10.41C17.25 10.24 17.25 10.02 17.27 9.84L17.27 9.84C17.29 9.71 17.36 9.14 17.93 8.86Z" fill="#F87171"/></svg>
    ),
    action: 'logout' as const,
    danger: true,
  },
]

export default function AccountPage() {
  const navigate = useNavigate()
  const platform = usePlatform()
  const themeStore = useThemeStore()
  const authStore = useAuthStore()
  const user = platform.user

  // Check authentication - redirect to auth if not authenticated
  useEffect(() => {
    if (!authStore.isAuthenticated) {
      navigate('/auth?return=/account', { replace: true })
      return
    }
  }, [authStore.isAuthenticated, navigate])

  // Telegram native BackButton (replaces inline back arrow)
  useTelegramBackButton(true)

  const [stats, setStats] = useState<{ joinDays: number }>({
    joinDays: 0,
  })

  useEffect(() => {
    const phone = authStore.isAuthenticated && authStore.phone
      ? authStore.phone
      : localStorage.getItem('yookie_booking_phone')

    if (!phone) return

    let cancelled = false
    fetchClientStats(phone)
      .then((data) => {
        if (cancelled) return
        const joinedAt = new Date(data.joinedAt)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - joinedAt.getTime())
        const joinDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        setStats({
          joinDays,
        })
      })
      .catch(() => { /* stats are non-critical */ })

    return () => { cancelled = true }
  }, [authStore.phone, authStore.isAuthenticated])

  const handleMenuItemClick = (item: typeof menuItems[0]) => {
    if (item.action === 'logout') {
      authStore.logout()
      navigate('/')
      return
    }
    if (item.action === 'support') {
      window.open(SUPPORT_URL, '_blank')
      return
    }
    if (item.path) navigate(item.path)
  }

  // If not authenticated, don't render the page (will redirect)
  if (!authStore.isAuthenticated) {
    return null
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.headerTitle}>Меню</span>
      </header>

      <div className={styles.content}>
        <div className={styles.profileSection}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt="avatar" className={styles.avatarImg} />
              ) : (
                <div className={styles.avatarFallback}>
                  {(user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')}
                </div>
              )}
            </div>
          </div>
          <h1 className={styles.userName}>{user?.firstName ?? ''} {user?.lastName ?? ''}</h1>
          <p className={styles.userSub}>Спасибо, что с нами уже {stats.joinDays || '—'} дней</p>
        </div>

        {/* Theme toggle */}
        <div className={styles.themeToggle}>
          <button className={styles.themeBtn} onClick={themeStore.toggle}>
            <span className={styles.themeIcon}>{themeStore.theme === 'dark' ? '🌙' : '☀️'}</span>
            <span className={styles.themeLabel}>Тема</span>
            <span className={styles.themeValue}>
              {themeStore.theme === 'dark' ? 'Тёмная' : 'Светлая'}
            </span>
          </button>
        </div>

        <div className={styles.menuList}>
          {menuItems.map((item, idx) => (
            <button
              key={item.id}
              className={`${styles.menuItem} ${idx > 0 ? styles.menuItemBorder : ''}`}
              onClick={() => handleMenuItemClick(item)}
            >
              <div className={styles.menuItemLeft}>
                <div className={styles.menuIconWrap}>{item.icon}</div>
                <span className={`${styles.menuLabel} ${item.danger ? styles.menuLabelDanger : ''}`}>{item.label}</span>
              </div>
              <ChevronRight color={item.danger ? '#FEE2E2' : '#303235'} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
