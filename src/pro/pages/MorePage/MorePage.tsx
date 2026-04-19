import { useNavigate } from 'react-router-dom';
import { ProLayout } from '@/pro/components/ProLayout/ProLayout';
import styles from './MorePage.module.css';

export default function MorePage() {
  const navigate = useNavigate();

  const items = [
    { label: 'Сотрудники', path: '/pro/staff' },
    { label: 'Клиенты', path: '/pro/clients' },
    { label: 'Профиль заведения', path: '/pro/settings' },
    { label: 'Предпросмотр страницы', path: '/pro/preview' },
  ];

  return (
    <ProLayout title="Ещё">
      <div className={styles.list}>
        {items.map((item) => (
          <button
            key={item.path}
            className={styles.row}
            onClick={() => navigate(item.path)}
          >
            <span>{item.label}</span>
            <span className={styles.chev}>›</span>
          </button>
        ))}
      </div>
    </ProLayout>
  );
}
