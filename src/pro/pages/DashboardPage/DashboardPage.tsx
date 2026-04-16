import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProLayout } from '@/pro/components/ProLayout/ProLayout';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { dashboardSummary } from '@/pro/api';
import { subscribe } from '@/pro/realtime';
import styles from './DashboardPage.module.css';

interface Summary {
  bookingsCount: number;
  revenuePlaceholder: number;
  loadPercent: number;
  emptySlots: number;
  cancellations: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { merchantId } = useMerchantStore();
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    if (!merchantId) return;
    const load = () => {
      dashboardSummary(merchantId, new Date().toISOString().slice(0, 10))
        .then(setSummary)
        .catch(() => { /* non-critical */ });
    };
    load();
    const unsub = subscribe((ev) => {
      if ('merchantId' in ev && ev.merchantId === merchantId) load();
    });
    return unsub;
  }, [merchantId]);

  return (
    <ProLayout title="Сегодня">
      <section className={styles.kpis}>
        <Kpi label="ЗАПИСИ" value={summary?.bookingsCount ?? '—'} />
        <Kpi label="ВЫРУЧКА" value={summary ? `${summary.revenuePlaceholder} ₽` : '—'} />
        <Kpi label="ЗАГРУЗКА" value={summary ? `${summary.loadPercent}%` : '—'} />
      </section>

      <section className={styles.quickActions}>
        <button
          className={styles.primary}
          onClick={() => navigate('/pro/bookings?new=1')}
        >
          + Новая запись
        </button>
        <button
          className={styles.secondary}
          onClick={() => navigate('/pro/bookings')}
        >
          Открыть календарь
        </button>
      </section>

      <section className={styles.alerts}>
        <h3 className={styles.sectionTitle}>Уведомления</h3>
        <AlertRow
          tone="info"
          title={`Свободных слотов: ${summary?.emptySlots ?? '—'}`}
          hint="Рассмотрите возможность продвижения"
        />
        {summary && summary.cancellations > 0 && (
          <AlertRow
            tone="warn"
            title={`Отмены сегодня: ${summary.cancellations}`}
            hint="Проверьте график мастеров"
          />
        )}
      </section>

      <section className={styles.links}>
        <LinkRow label="Услуги" onClick={() => navigate('/pro/services')} />
        <LinkRow label="Сотрудники" onClick={() => navigate('/pro/staff')} />
        <LinkRow label="Клиенты" onClick={() => navigate('/pro/clients')} />
        <LinkRow label="Профиль заведения" onClick={() => navigate('/pro/settings')} />
      </section>
    </ProLayout>
  );
}

function Kpi({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.kpi}>
      <span className={styles.kpiLabel}>{label}</span>
      <span className={styles.kpiValue}>{value}</span>
    </div>
  );
}

function AlertRow({ tone, title, hint }: { tone: 'info' | 'warn'; title: string; hint: string }) {
  return (
    <div className={`${styles.alert} ${styles[`alert-${tone}`]}`}>
      <span className={styles.alertTitle}>{title}</span>
      <span className={styles.alertHint}>{hint}</span>
    </div>
  );
}

function LinkRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className={styles.linkRow} onClick={onClick}>
      <span>{label}</span>
      <span className={styles.chev}>›</span>
    </button>
  );
}
