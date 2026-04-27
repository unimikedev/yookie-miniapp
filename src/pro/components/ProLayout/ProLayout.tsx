import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TAB_PATHS = ['/pro', '/pro/bookings', '/pro/clients', '/pro/more', '/pro/schedule', '/pro/my-profile'];
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { useAuthStore } from '@/stores/authStore';
import { listMyBusinesses } from '@/pro/api';
import { ProBottomNav } from '@/pro/components/ProBottomNav/ProBottomNav';
import styles from './ProLayout.module.css';

interface ProLayoutProps {
  children: React.ReactNode;
  title?: string;
  /** Extra actions rendered in header (e.g. "+ Новая запись"). */
  actions?: React.ReactNode;
  /** Hide bottom nav for full-screen flows (e.g. booking edit sheet). */
  hideNav?: boolean;
  /** Skip onboarding gate — used by settings page during business creation. */
  allowWithoutBusiness?: boolean;
}

/**
 * Shell for all Pro screens. Enforces authentication + merchant context.
 * If user is not authenticated → redirect to auth.
 * If user has no businessId → show onboarding prompt.
 */
export function ProLayout({ children, title, actions, hideNav, allowWithoutBusiness }: ProLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuthStore();
  const merchant = useMerchantStore();
  const [hasMultiple, setHasMultiple] = useState(false);

  useEffect(() => {
    if (!merchant.merchantId) return;
    listMyBusinesses().then((list) => setHasMultiple(list.length > 1)).catch(() => {});
  }, [merchant.merchantId]);

  // Show back button on any Pro sub-page (not the dashboard root)
  const isSubPage = location.pathname !== '/pro';

  // Auto-hide bottom nav on non-tab pages (2nd-level screens like settings, services, staff)
  const isTabPage = TAB_PATHS.includes(location.pathname);
  const shouldHideNav = hideNav || !isTabPage;

  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate('/auth?return=/pro', { replace: true });
      return;
    }
    // merchantStore already initializes from localStorage/token at module load.
    // Re-calling loadFromToken() here would overwrite a valid merchantId with
    // null if the JWT predates multi-business support (no businessId field).
    merchant.enterProMode();
    return () => merchant.exitProMode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated]);

  // Not authenticated — will redirect, show nothing
  if (!auth.isAuthenticated) {
    return null;
  }

  // No business assigned — onboarding needed (skip for settings page during creation)
  if (!merchant.merchantId && !allowWithoutBusiness) {
    return (
      <div className={styles.layout}>
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            <span className={styles.brand}>Yookie Pro</span>
          </div>
          <div className={styles.actions} />
        </header>
        <main className={styles.main}>
          <div className={styles.onboarding}>
            <h2 className={styles.onboardingTitle}>Добро пожаловать в Yookie Pro</h2>
            <p className={styles.onboardingText}>
              Чтобы начать принимать записи, создайте свой бизнес-профиль.
            </p>
            <button
              className={styles.onboardingBtn}
              onClick={() => navigate('/pro/settings')}
            >
              Создать бизнес
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        {isSubPage ? (
          <button
            className={styles.backBtn}
            onClick={() => navigate('/pro', { replace: true })}
            aria-label="Назад"
          >
            ‹
          </button>
        ) : (
          <div />
        )}
        <div className={styles.titleBlock}>
          <span className={styles.brand}>Yookie Pro</span>
          {title && <span className={styles.pageTitle}>{title}</span>}
        </div>
        <div className={styles.actions}>
          {hasMultiple && (
            <button
              className={styles.switcherBtn}
              onClick={() => navigate('/pro/select')}
              title="Сменить бизнес"
            >
              ⇄
            </button>
          )}
          {actions}
        </div>
      </header>

      <main className={`${styles.main} ${shouldHideNav ? '' : styles.withNav}`}>
        {children}
      </main>

      {!shouldHideNav && <ProBottomNav />}
    </div>
  );
}
