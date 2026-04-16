import { useNavigate } from 'react-router-dom';
import { ProLayout } from '@/pro/components/ProLayout/ProLayout';

/**
 * "More" tab — gateway to sub-screens that don't fit the bottom nav.
 * Keeps the bottom nav clean at 5 items while providing access to
 * Staff, Clients, and Merchant Settings.
 */
export default function MorePage() {
  const navigate = useNavigate();

  const items = [
    { label: 'Сотрудники', path: '/pro/staff' },
    { label: 'Клиенты', path: '/pro/clients' },
    { label: 'Профиль заведения', path: '/pro/settings' },
  ];

  return (
    <ProLayout title="Ещё">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
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
            }}
          >
            <span>{item.label}</span>
            <span style={{ color: 'var(--color-text-muted)' }}>›</span>
          </button>
        ))}
      </div>
    </ProLayout>
  );
}
