import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { useAuthStore } from '@/stores/authStore';
import { ProBottomNav } from '@/pro/components/ProBottomNav/ProBottomNav';
import styles from './ProLayout.module.css';

interface ProLayoutProps {
  children: React.ReactNode;
  title?: string;
  /** Extra actions rendered in header (e.g. "+ Новая запись"). */
  actions?: React.ReactNode;
  /** Hide bottom nav for full-screen flows (e.g. booking edit sheet). */
  hideNav?: boolean;
}

/**
 * Shell for all Pro screens. Keeps layout concerns (header, nav, safe areas)
 * out of individual pages and allows the Pro surface to be swapped for a
 * standalone client without touching page code.
 */
export function ProLayout({ children, title, actions, hideNav }: ProLayoutProps) {
  const navigate = useNavigate();
  const auth = useAuthStore();
  const merchant = useMerchantStore();

  // Dev convenience: auto-activate a demo merchant when authenticated
  useEffect(() => {
    merchant.loadFromStorage();
    if (!merchant.merchantId && auth.isAuthenticated) {
      merchant.setMerchantId('demo-merchant');
    }
    merchant.enterProMode();
    return () => merchant.exitProMode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated]);

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => navigate('/account')}
          aria-label="Выйти из Pro"
        >
          ←
        </button>
        <div className={styles.titleBlock}>
          <span className={styles.brand}>Yookie Pro</span>
          {title && <span className={styles.pageTitle}>{title}</span>}
        </div>
        <div className={styles.actions}>{actions}</div>
      </header>

      <main className={`${styles.main} ${hideNav ? '' : styles.withNav}`}>
        {children}
      </main>

      {!hideNav && <ProBottomNav />}
    </div>
  );
}
