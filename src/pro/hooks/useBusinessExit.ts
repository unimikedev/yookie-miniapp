import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { useAuthStore } from '@/stores/authStore';
import { leaveBusinessApi, resignFromBusinessApi } from '@/pro/api';

function confirm(msg: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Telegram?.WebApp?.showConfirm) {
      window.Telegram.WebApp.showConfirm(msg, resolve);
    } else {
      resolve(window.confirm(msg));
    }
  });
}

function applyNewToken(newToken: string) {
  localStorage.setItem('yookie_auth_token', newToken);
  try {
    const stored = JSON.parse(localStorage.getItem('yookie_auth_user') || '{}');
    stored.businessId = null;
    stored.role = null;
    localStorage.setItem('yookie_auth_user', JSON.stringify(stored));
    useAuthStore.setState(s => ({
      user: s.user ? { ...s.user, businessId: null, role: null as any } : s.user,
    }));
  } catch { /* noop */ }
}

export function useBusinessExit() {
  const navigate = useNavigate();
  const merchantStore = useMerchantStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearMerchant = () => {
    merchantStore.setMerchantId(null);
    merchantStore.setRole(null);
    merchantStore.setMasterId(null);
  };

  /** Leave the business — master record stays, user can re-join. */
  const leaveWithoutResigning = async (businessId: string) => {
    const ok = await confirm('Выйти из бизнеса? Ваш профиль мастера сохранится, вы сможете вернуться позже.');
    if (!ok) return;
    setLoading(true);
    setError(null);
    try {
      const { token } = await leaveBusinessApi(businessId);
      applyNewToken(token);
      clearMerchant();
      navigate('/pro', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  /** Resign — deactivates master record + cancels future bookings + disconnects. */
  const resignAndLeave = async (businessId: string) => {
    const ok = await confirm('Уволиться? Ваш профиль мастера и все будущие записи будут удалены. Это действие нельзя отменить.');
    if (!ok) return;
    setLoading(true);
    setError(null);
    try {
      const { token } = await resignFromBusinessApi(businessId);
      applyNewToken(token);
      clearMerchant();
      navigate('/pro', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  /** Full logout — clears JWT and returns to the public app. */
  const logout = async () => {
    const ok = await confirm('Выйти из аккаунта?');
    if (!ok) return;
    clearMerchant();
    useAuthStore.getState().logout();
    navigate('/', { replace: true });
  };

  return { leaveWithoutResigning, resignAndLeave, logout, loading, error };
}
