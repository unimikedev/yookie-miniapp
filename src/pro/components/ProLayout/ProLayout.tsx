import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TAB_PATHS = ['/pro', '/pro/bookings', '/pro/clients', '/pro/more', '/pro/schedule', '/pro/my-profile'];
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { useAuthStore } from '@/stores/authStore';
import styles from './ProLayout.module.css';

interface ProLayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
  hideNav?: boolean;
  allowWithoutBusiness?: boolean;
}

export function ProLayout({ children, title, actions, hideNav, allowWithoutBusiness }: ProLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuthStore();
  const merchant = useMerchantStore();

  const isPublished = useMerchantStore(s => s.isPublished);
  const isSubPage = location.pathname !== '/pro';
  const isTabPage = TAB_PATHS.includes(location.pathname);
  const shouldHideNav = hideNav || !isTabPage;
  const hasBanner = isPublished === false && isTabPage;

  // Use Telegram's native back button on sub-pages
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;
    if (isSubPage) {
      tg.BackButton.show();
      const handler = () => navigate(-1);
      tg.BackButton.onClick(handler);
      return () => {
        tg.BackButton.offClick(handler);
        tg.BackButton.hide();
      };
    } else {
      tg.BackButton.hide();
    }
  }, [isSubPage, location.pathname]);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate('/auth?return=/pro', { replace: true });
      return;
    }
    merchant.enterProMode();
    return () => merchant.exitProMode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated]);

  if (!auth.isAuthenticated) return null;

  if (!merchant.merchantId && !allowWithoutBusiness) {
    return (
      <div className={styles.layout}>
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
      {(title || actions) && (
        <div className={styles.pageHeader}>
          {title && <h1 className={styles.pageTitle}>{title}</h1>}
          {actions && <div className={styles.pageActions}>{actions}</div>}
        </div>
      )}

      <main
        className={`${styles.main} ${shouldHideNav ? '' : styles.withNav} ${title || actions ? styles.withPageHeader : ''}`}
        style={hasBanner ? { paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 132px)' } : undefined}
      >
        {children}
      </main>
    </div>
  );
}
