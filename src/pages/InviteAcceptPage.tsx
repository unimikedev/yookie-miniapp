import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInviteInfo, acceptInvite } from '@/pro/api';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { useAuthStore } from '@/stores/authStore';
import styles from './InviteAcceptPage.module.css';

interface InviteInfo {
  valid: boolean;
  businessId?: string;
  businessName?: string;
  role?: string;
  masterId?: string | null;
  reason?: string;
}

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const merchantStore = useMerchantStore();

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!localStorage.getItem('yookie_auth_token');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getInviteInfo(token)
      .then(setInviteInfo)
      .catch(() => setInviteInfo({ valid: false, reason: 'Не удалось загрузить приглашение' }))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    setError(null);
    try {
      const result = await acceptInvite(token);
      // Store new JWT
      localStorage.setItem('yookie_auth_token', result.token);
      // Sync authStore user with new businessId and role
      try {
        const storedUser = JSON.parse(localStorage.getItem('yookie_auth_user') || '{}');
        storedUser.businessId = result.businessId;
        storedUser.role = result.role;
        localStorage.setItem('yookie_auth_user', JSON.stringify(storedUser));
        useAuthStore.setState(s => ({
          user: s.user ? { ...s.user, businessId: result.businessId, role: result.role as any } : s.user,
        }));
      } catch { /* noop */ }
      // Refresh merchant store with new token data
      merchantStore.setMerchantId(result.businessId);
      merchantStore.setRole(result.role as 'staff' | 'owner');
      if (result.masterId) merchantStore.setMasterId(result.masterId);
      merchantStore.enterProMode();
      navigate('/pro', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Не удалось принять приглашение';
      setError(msg + '. Попробуйте позже.');
    } finally {
      setAccepting(false);
    }
  };

  const handleGoToAuth = () => {
    navigate(`/auth?return=/invite/${token}`);
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <p className={styles.loadingText}>Загрузка приглашения…</p>
        </div>
      </div>
    );
  }

  if (!inviteInfo || !inviteInfo.valid) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.iconError}>✕</div>
          <h2 className={styles.title}>Приглашение недействительно</h2>
          <p className={styles.subtitle}>
            {inviteInfo?.reason || 'Эта ссылка уже использована или истекла.'}
          </p>
          <button className={styles.btnSecondary} onClick={() => navigate('/')}>
            На главную
          </button>
        </div>
      </div>
    );
  }

  const roleLabel = inviteInfo.role === 'staff' ? 'Сотрудник' : inviteInfo.role ?? 'Сотрудник';

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconInvite}>✉</div>
        <h2 className={styles.title}>Приглашение</h2>
        <p className={styles.subtitle}>
          Вас приглашают в{' '}
          <strong>{inviteInfo.businessName ?? 'бизнес'}</strong>{' '}
          как <strong>{roleLabel}</strong>
        </p>

        {error && <p className={styles.errorText}>{error}</p>}

        {!isAuthenticated ? (
          <>
            <p className={styles.authHint}>Войдите, чтобы принять приглашение</p>
            <button className={styles.btnPrimary} onClick={handleGoToAuth}>
              Войти
            </button>
          </>
        ) : (
          <button
            className={styles.btnPrimary}
            onClick={handleAccept}
            disabled={accepting}
          >
            {accepting ? 'Принимаем…' : 'Принять приглашение'}
          </button>
        )}

        <button className={styles.btnSecondary} onClick={() => navigate('/')}>
          Отмена
        </button>
      </div>
    </div>
  );
}
