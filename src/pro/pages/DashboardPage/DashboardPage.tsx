import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProLayout } from '@/pro/components/ProLayout/ProLayout';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { dashboardSummary, listBookings, listPendingBookings, listStaff, updateBookingStatus, listActivity } from '@/pro/api';
import type { ActivityEvent } from '@/pro/api';
import { subscribe, startPolling } from '@/pro/realtime';
import type { Booking, Master } from '@/lib/api/types';
import styles from './DashboardPage.module.css';

interface Summary {
  bookingsCount: number;
  revenuePlaceholder: number;
  loadPercent: number;
  emptySlots: number;
  cancellations: number;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { merchantId } = useMerchantStore();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pending, setPending] = useState<Booking[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [staff, setStaff] = useState<Master[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const loadPending = useCallback(() => {
    if (!merchantId) return;
    listPendingBookings(merchantId).then(setPending).catch(() => {});
  }, [merchantId]);

  const loadActivity = useCallback(() => {
    if (!merchantId) return;
    listActivity(merchantId).then(setActivity).catch(() => {});
  }, [merchantId]);

  useEffect(() => {
    if (!merchantId) return;
    listStaff(merchantId).then(setStaff).catch(() => {});
  }, [merchantId]);

  useEffect(() => {
    if (!merchantId) return;
    const loadSummary = () => {
      dashboardSummary(merchantId, today).then(setSummary).catch(() => {});
    };
    loadSummary();
    loadPending();
    loadActivity();

    const unsub = subscribe((ev) => {
      if ('merchantId' in ev && ev.merchantId === merchantId) {
        loadSummary();
        loadPending();
        loadActivity();
      }
    });
    const stopPoll = startPolling(() => { loadSummary(); loadPending(); loadActivity(); }, 15000);
    return () => { unsub(); stopPoll(); };
  }, [merchantId, loadPending, loadActivity]);

  const handleAction = async (bookingId: string, status: 'confirmed' | 'cancelled') => {
    if (!merchantId) return;
    setActionId(bookingId);
    try {
      await updateBookingStatus(merchantId, bookingId, status);
      loadPending();
      loadActivity();
    } finally {
      setActionId(null);
    }
  };

  const staffMap = new Map(staff.map((s) => [s.id, s.name]));

  return (
    <ProLayout title="Сегодня">
      {/* ── Pending bookings — top priority block ── */}
      {pending.length > 0 && (
        <section className={styles.pendingSection}>
          <h2 className={styles.pendingTitle}>
            Ожидают подтверждения
            <span className={styles.pendingBadge}>{pending.length}</span>
          </h2>
          {pending.map((b) => (
            <div key={b.id} className={styles.pendingCard}>
              <div className={styles.pendingMeta}>
                <span className={styles.pendingTime}>
                  {fmtDate(b.starts_at)} · {fmt(b.starts_at)}
                </span>
                {staffMap.get(b.master_id) && (
                  <span className={styles.pendingMaster}>{staffMap.get(b.master_id)}</span>
                )}
              </div>
              <div className={styles.pendingClient}>
                <span className={styles.pendingClientName}>{b.clients?.name ?? '—'}</span>
                {b.clients?.phone && (
                  <span className={styles.pendingClientPhone}>{b.clients.phone}</span>
                )}
              </div>
              {b.services?.name && (
                <span className={styles.pendingService}>{b.services.name}</span>
              )}
              {b.notes && (
                <span className={styles.pendingNotes}>💬 {b.notes}</span>
              )}
              <div className={styles.pendingActions}>
                <button
                  className={styles.confirmBtn}
                  disabled={actionId === b.id}
                  onClick={() => handleAction(b.id, 'confirmed')}
                >
                  {actionId === b.id ? '…' : '✓ Подтвердить'}
                </button>
                <button
                  className={styles.declineBtn}
                  disabled={actionId === b.id}
                  onClick={() => handleAction(b.id, 'cancelled')}
                >
                  Отклонить
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className={styles.kpis}>
        <Kpi label="ЗАПИСИ" value={summary?.bookingsCount ?? '—'} />
        <Kpi label="ВЫРУЧКА" value={summary ? `${summary.revenuePlaceholder.toLocaleString('ru')} ₽` : '—'} />
        <Kpi label="ЗАГРУЗКА" value={summary ? `${summary.loadPercent}%` : '—'} />
      </section>

      <section className={styles.quickActions}>
        <button className={styles.primary} onClick={() => navigate('/pro/bookings?new=1')}>
          + Новая запись
        </button>
        <button className={styles.secondary} onClick={() => navigate('/pro/bookings')}>
          Открыть календарь
        </button>
      </section>

      <section className={styles.alerts}>
        <h3 className={styles.sectionTitle}>Сводка</h3>
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

      {activity.length > 0 && (
        <section className={styles.activitySection}>
          <h3 className={styles.sectionTitle}>Последние события</h3>
          {activity.map((ev) => {
            const info = activityInfo(ev);
            return (
              <div key={ev.id} className={`${styles.activityRow} ${styles[`activity-${info.tone}`]}`}>
                <span className={styles.activityIcon}>{info.icon}</span>
                <div className={styles.activityBody}>
                  <span className={styles.activityLabel}>{info.label}</span>
                  <span className={styles.activityMeta}>
                    {ev.clients?.name ?? '—'}
                    {ev.services?.name ? ` · ${ev.services.name}` : ''}
                    {ev.masters?.name ? ` · ${ev.masters.name}` : ''}
                  </span>
                  {ev.cancel_reason && (
                    <span className={styles.activityReason}>«{ev.cancel_reason}»</span>
                  )}
                </div>
                <span className={styles.activityTime}>{relativeTime(ev.updated_at)}</span>
              </div>
            );
          })}
        </section>
      )}

      <section className={styles.links}>
        <LinkRow label="Услуги" onClick={() => navigate('/pro/services')} />
        <LinkRow label="Сотрудники" onClick={() => navigate('/pro/staff')} />
        <LinkRow label="Клиенты" onClick={() => navigate('/pro/clients')} />
        <LinkRow label="Профиль заведения" onClick={() => navigate('/pro/settings')} />
      </section>
    </ProLayout>
  );
}

type Tone = 'new' | 'confirmed' | 'cancelled' | 'completed' | 'noshow' | 'rescheduled';

function activityInfo(ev: ActivityEvent): { icon: string; label: string; tone: Tone } {
  const isRescheduled =
    ev.status === 'pending' &&
    Math.abs(new Date(ev.updated_at).getTime() - new Date(ev.created_at).getTime()) > 60_000;

  if (isRescheduled) {
    return { icon: '↻', label: 'Клиент перенёс запись', tone: 'rescheduled' };
  }
  switch (ev.status) {
    case 'pending':
      return { icon: '●', label: 'Новая запись', tone: 'new' };
    case 'confirmed':
      return { icon: '✓', label: 'Запись подтверждена', tone: 'confirmed' };
    case 'cancelled':
      if (ev.cancelled_by === 'client') return { icon: '✕', label: 'Клиент отменил запись', tone: 'cancelled' };
      return { icon: '✕', label: 'Запись отменена', tone: 'cancelled' };
    case 'completed':
      return { icon: '✓', label: 'Визит завершён', tone: 'completed' };
    case 'no_show':
      return { icon: '!', label: 'Клиент не явился', tone: 'noshow' };
    default:
      return { icon: '·', label: ev.status, tone: 'new' };
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'только что';
  if (min < 60) return `${min} мин назад`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'вчера';
  return `${d} д назад`;
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
