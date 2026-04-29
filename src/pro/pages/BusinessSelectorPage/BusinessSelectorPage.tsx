import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listMyBusinesses, switchBusiness } from '@/pro/api';
import type { BusinessSummary } from '@/pro/api';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { useAuthStore } from '@/stores/authStore';
import { LoadingState } from '@/components/ui/LoadingState';
import styles from './BusinessSelectorPage.module.css';

const CATEGORY_LABELS: Record<string, string> = {
  hair: 'Волосы', nail: 'Ногти', brow_lash: 'Брови и ресницы',
  makeup: 'Макияж', spa_massage: 'СПА и массаж', epilation: 'Эпиляция',
  cosmetology: 'Косметология', barber: 'Барбершоп', tattoo: 'Тату',
  piercing: 'Пирсинг', yoga: 'Йога', fitness: 'Фитнес', other: 'Другое',
};

const ROLE_LABELS: Record<string, string> = {
  owner: 'Владелец', admin: 'Администратор', staff: 'Сотрудник',
};

export default function BusinessSelectorPage() {
  const navigate = useNavigate();
  const { setMerchantId, setRole, setMasterId } = useMerchantStore();
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    listMyBusinesses()
      .then(setBusinesses)
      .catch(() => setBusinesses([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (biz: BusinessSummary) => {
    setSwitching(biz.id);
    try {
      const result = await switchBusiness(biz.id);
      localStorage.setItem('yookie_auth_token', result.token);
      try {
        const stored = JSON.parse(localStorage.getItem('yookie_auth_user') || '{}');
        stored.businessId = result.businessId;
        stored.role = result.role;
        localStorage.setItem('yookie_auth_user', JSON.stringify(stored));
        useAuthStore.setState(s => ({
          user: s.user ? { ...s.user, businessId: result.businessId, role: result.role } : s.user,
          token: result.token,
        }));
      } catch { /* noop */ }
      setMerchantId(result.businessId);
      setRole(result.role as 'owner' | 'staff');
      if (result.masterId) setMasterId(result.masterId);
      useMerchantStore.getState().setBusinessName(biz.name);
      navigate('/pro', { replace: true });
    } catch {
      setSwitching(null);
    }
  };

  const handleAddBusiness = () => {
    navigate('/pro/new-business');
  };

  if (loading) return <LoadingState variant="skeleton" />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Мои бизнесы</h1>
        <p className={styles.subtitle}>Выберите бизнес для управления</p>
      </div>

      <div className={styles.list}>
        {businesses.map((biz) => (
          <button
            key={biz.id}
            className={styles.card}
            onClick={() => handleSelect(biz)}
            disabled={switching !== null}
          >
            <div className={styles.cardAvatar}>
              {biz.photo_url ? (
                <img src={biz.photo_url} className={styles.cardAvatarImg} alt={biz.name} />
              ) : (
                <span className={styles.cardAvatarLetter}>
                  {(biz.name?.[0] ?? '?').toUpperCase()}
                </span>
              )}
            </div>

            <div className={styles.cardBody}>
              <span className={styles.cardName}>{biz.name}</span>
              <span className={styles.cardMeta}>
                {CATEGORY_LABELS[biz.category] ?? biz.category}
              </span>
            </div>

            <div className={styles.cardRight}>
              <span className={styles.roleBadge} data-role={biz.role}>
                {ROLE_LABELS[biz.role] ?? biz.role}
              </span>
              {switching === biz.id ? (
                <span className={styles.spinner}>…</span>
              ) : (
                <span className={styles.arrow}>›</span>
              )}
            </div>
          </button>
        ))}
      </div>

      <button className={styles.addBtn} onClick={handleAddBusiness}>
        + Добавить ещё бизнес
      </button>
    </div>
  );
}
