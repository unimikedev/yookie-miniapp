import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProLayout } from '@/pro/components/ProLayout/ProLayout';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useAuthStore } from '@/stores/authStore';
import { useMerchantStore } from '@/pro/stores/merchantStore';

const itemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '14px 16px',
  background: 'var(--color-surface)',
  borderRadius: '14px',
  border: 0,
  color: 'var(--color-text)',
  fontFamily: 'var(--font-family)',
  fontSize: 'var(--text-body-size)',
  fontWeight: 500,
  cursor: 'pointer',
  textAlign: 'left' as const,
  width: '100%',
};

const groupLabelStyle: React.CSSProperties = {
  fontSize: 'var(--text-caption-xs-size)',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  padding: '12px 4px 4px',
  margin: 0,
};

export default function MorePage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { setMerchantId, setRole } = useMerchantStore();
  const [logoutSheetOpen, setLogoutSheetOpen] = useState(false);

  const handleLogout = () => {
    setLogoutSheetOpen(false);
    setMerchantId(null);
    setRole(null);
    logout();
    navigate('/', { replace: true });
  };

  const NavItem = ({ label, path }: { label: string; path: string }) => (
    <button style={itemStyle} onClick={() => navigate(path)}>
      <span>{label}</span>
      <span style={{ color: 'var(--color-text-muted)' }}>›</span>
    </button>
  );

  return (
    <ProLayout title="Ещё">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

        <p style={groupLabelStyle}>Команда</p>
        <NavItem label="Мастера" path="/pro/staff" />
        <NavItem label="Галерея" path="/pro/gallery" />

        <p style={groupLabelStyle}>Заведение</p>
        <NavItem label="Настройки заведения" path="/pro/settings" />
        <NavItem label="Сменить бизнес" path="/pro/select" />

        <p style={groupLabelStyle}>Аккаунт</p>
        <button
          style={{ ...itemStyle, color: 'var(--color-error, #F87171)' }}
          onClick={() => setLogoutSheetOpen(true)}
        >
          <span>Выйти</span>
        </button>
      </div>

      <BottomSheet
        open={logoutSheetOpen}
        onClose={() => setLogoutSheetOpen(false)}
        title="Выйти из аккаунта?"
      >
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-size)', margin: '0 0 20px', lineHeight: 1.5 }}>
          Вы выйдете из учётной записи и текущего заведения. Войти снова можно через приложение.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={handleLogout}
            style={{
              padding: '14px',
              background: 'var(--color-error, #F87171)',
              color: '#fff',
              border: 0,
              borderRadius: '14px',
              fontFamily: 'var(--font-family)',
              fontSize: 'var(--text-body-size)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Да, выйти
          </button>
          <button
            onClick={() => setLogoutSheetOpen(false)}
            style={{
              padding: '14px',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              border: 0,
              borderRadius: '14px',
              fontFamily: 'var(--font-family)',
              fontSize: 'var(--text-body-size)',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Отмена
          </button>
        </div>
      </BottomSheet>
    </ProLayout>
  );
}
