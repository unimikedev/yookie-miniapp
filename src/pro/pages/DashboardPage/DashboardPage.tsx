import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProLayout } from '@/pro/components/ProLayout/ProLayout';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { listBookings, listPendingBookings, listStaff, listServices, updateBookingStatus, listActivity, patchBusiness } from '@/pro/api';
import type { ActivityEvent } from '@/pro/api';
import type { Service } from '@/lib/api/types';
import { api } from '@/lib/api/client';
import { subscribe, startPolling } from '@/pro/realtime';
import type { Booking, BookingStatus, Master } from '@/lib/api/types';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import styles from './DashboardPage.module.css';

const STATUS_KEY_MAP: Record<string, string> = {
  pending:   'pro.bookings.statusPending',
  confirmed: 'pro.bookings.statusConfirmed',
  cancelled: 'pro.bookings.statusCancelled',
  completed: 'pro.bookings.statusCompleted',
  no_show:   'pro.bookings.statusNoShow',
};

function fmt(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'uz' ? 'uz-UZ' : 'ru-RU';
  const { merchantId, businessName } = useMerchantStore();
  const tgSyncDone = useRef(false);

  const [pending, setPending] = useState<Booking[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [staff, setStaff] = useState<Master[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [businessActive, setBusinessActive] = useState<boolean | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [date, setDate] = useState(() => new Date());
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null);

  const showToast = (msg: string) => setToast({ msg, key: Date.now() });

  const dateStr  = useMemo(() => isoDate(date), [date]);
  const todayStr = useMemo(() => isoDate(new Date()), []);
  const isToday  = dateStr === todayStr;

  const dateLabel = date.toLocaleDateString(locale, {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  const prevDay   = () => setDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; });
  const nextDay   = () => setDate(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; });
  const goToToday = () => setDate(new Date());

  // One-time: sync merchant Telegram ID for notifications
  useEffect(() => {
    if (!merchantId || tgSyncDone.current) return;
    const tgId = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id;
    if (!tgId) return;
    tgSyncDone.current = true;
    patchBusiness(merchantId, { admin_telegram_id: tgId }).catch(() => {});
  }, [merchantId]);

  useEffect(() => {
    if (!merchantId) return;
    listStaff(merchantId).then(setStaff).catch(() => {});
    listServices(merchantId).then(setServices).catch(() => {});
    api.get<{ is_active: boolean }>(`/businesses/${merchantId}`)
      .then(b => {
        if (b) {
          setBusinessActive(b.is_active);
          useMerchantStore.getState().setIsPublished(b.is_active);
        }
      })
      .catch(() => {
        setBusinessActive(false);
        useMerchantStore.getState().setIsPublished(false);
      });
  }, [merchantId]);

  const loadPending = useCallback(() => {
    if (!merchantId) return;
    listPendingBookings(merchantId).then(setPending).catch(() => {});
  }, [merchantId]);

  const loadActivity = useCallback(() => {
    if (!merchantId) return;
    listActivity(merchantId).then(setActivity).catch(() => {});
  }, [merchantId]);

  const loadBookings = useCallback(() => {
    if (!merchantId) return;
    listBookings(merchantId, {
      from: `${dateStr}T00:00:00`,
      to:   `${dateStr}T23:59:59`,
    }).then(setBookings).catch(() => {});
  }, [merchantId, dateStr]);

  useEffect(() => {
    if (!merchantId) return;
    loadBookings();
    loadPending();
    loadActivity();

    const unsub = subscribe((ev) => {
      if ('merchantId' in ev && ev.merchantId === merchantId) {
        loadBookings();
        loadPending();
        loadActivity();
      }
    });
    const stopPoll = startPolling(() => {
      loadBookings();
      loadPending();
      loadActivity();
    }, 15000);
    return () => { unsub(); stopPoll(); };
  }, [merchantId, loadBookings, loadPending, loadActivity]);

  const handlePendingAction = async (bookingId: string, status: 'confirmed' | 'cancelled') => {
    if (!merchantId) return;
    setActionId(bookingId);
    try {
      await updateBookingStatus(merchantId, bookingId, status);
      loadPending();
      loadBookings();
      loadActivity();
      showToast(status === 'confirmed' ? t('pro.dashboard.toastConfirmed') : t('pro.dashboard.toastDeclined'));
    } finally {
      setActionId(null);
    }
  };

  const handleBookingAction = async (status: BookingStatus) => {
    if (!selectedBooking || !merchantId) return;
    setActionLoading(true);
    try {
      await updateBookingStatus(merchantId, selectedBooking.id, status);
      setSelectedBooking(null);
      loadBookings();
      loadPending();
      loadActivity();
      const toastMsg: Record<BookingStatus, string> = {
        confirmed: t('pro.dashboard.toastConfirmed'),
        cancelled: t('pro.bookings.cancel'),
        completed: t('pro.dashboard.toastCompleted'),
        no_show:   t('pro.dashboard.toastNoShow'),
        pending:   '',
      };
      if (toastMsg[status]) showToast(toastMsg[status]);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!merchantId) return;
    setPublishing(true);
    try {
      await patchBusiness(merchantId, { is_active: true });
      setBusinessActive(true);
      useMerchantStore.getState().setIsPublished(true);
      showToast(t('pro.dashboard.published', 'Профиль опубликован!'));
    } catch {
      showToast(t('pro.dashboard.publishError', 'Не удалось опубликовать'));
    } finally {
      setPublishing(false);
    }
  };

  const hasStaff = staff.length > 0;
  const hasServices = services.length > 0;
  const isReadyToPublish = hasStaff && hasServices;
  const isPublished = businessActive === true;

  const staffMap = new Map(staff.map(s => [s.id, s.name]));

  const sortedBookings = useMemo(
    () => [...bookings].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()),
    [bookings]
  );

  return (
    <ProLayout title={businessName || t('pro.dashboard.title')}>

      {/* ── Date navigation ── */}
      <div className={styles.dateNav}>
        <div className={styles.dateNavLeft}>
          <button className={styles.dateArrow} onClick={prevDay}>‹</button>
          <span className={styles.dateLabel} style={{ textTransform: 'capitalize' }}>{dateLabel}</span>
          <button className={styles.dateArrow} onClick={nextDay}>›</button>
          {!isToday && (
            <button className={styles.todayBtn} onClick={goToToday}>← {t('pro.dashboard.today')}</button>
          )}
        </div>
        <button className={styles.newBookingBtn} onClick={() => navigate('/pro/bookings?new=1')}>
          {t('pro.dashboard.newBooking')}
        </button>
      </div>

      {/* ── Pending confirmations ── */}
      {pending.length > 0 && (
        <section className={styles.pendingSection}>
          <h2 className={styles.pendingTitle}>
            {t('pro.dashboard.pendingTitle')}
            <span className={styles.pendingBadge}>{pending.length}</span>
          </h2>
          {pending.map((b) => {
            const masterName = staffMap.get(b.master_id);
            return (
            <div key={b.id} className={styles.pendingCard}>
              <div className={styles.pendingMeta}>
                <span className={styles.pendingTime}>
                  {fmtDate(b.starts_at, locale)} · {fmt(b.starts_at, locale)}
                </span>
                {masterName && (
                  <span className={styles.pendingMaster}>{masterName}</span>
                )}
              </div>
              {b.rescheduled && (
                <span className={styles.rescheduledBadge}>↻ {t('pro.dashboard.rescheduleNotice')}</span>
              )}
              <div className={styles.pendingClient}>
                <span className={styles.pendingClientName}>{b.clients?.name ?? '—'}</span>
                {b.clients?.phone && (
                  <a href={`tel:${b.clients.phone}`} className={styles.pendingClientPhone}>
                    {b.clients.phone}
                  </a>
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
                  onClick={() => handlePendingAction(b.id, 'confirmed')}
                >
                  {actionId === b.id ? '…' : `✓ ${t('pro.dashboard.confirm')}`}
                </button>
                <button
                  className={styles.declineBtn}
                  disabled={actionId === b.id}
                  onClick={() => handlePendingAction(b.id, 'cancelled')}
                >
                  {t('pro.dashboard.decline')}
                </button>
              </div>
            </div>
          );
          })}
        </section>
      )}

      {/* ── Day schedule ── */}
      <section className={styles.scheduleSection}>
        <div className={styles.scheduleTitleRow}>
          <h3 className={styles.sectionTitle}>{isToday ? t('pro.dashboard.today') : t('pro.bookings.title')}</h3>
          {bookings.length > 0 && (
            <span className={styles.countBadge}>{bookings.length}</span>
          )}
        </div>

        {sortedBookings.length === 0 ? (
          <div className={styles.emptyDay}>
            <span className={styles.emptyDayIcon}>📅</span>
            <p className={styles.emptyDayTitle}>{t('pro.dashboard.noBookings', 'Нет записей')}</p>
            <p className={styles.emptyDayDesc}>{t('pro.dashboard.noBookingsDesc', 'На этот день пока нет записей')}</p>
            <button className={styles.emptyAddBtn} onClick={() => navigate('/pro/bookings?new=1')}>
              + {t('pro.dashboard.addBooking', 'Добавить запись')}
            </button>
          </div>
        ) : (
          sortedBookings.map((b) => (
            <TodayRow
              key={b.id}
              booking={b}
              masterName={staffMap.get(b.master_id)}
              onClick={() => setSelectedBooking(b)}
            />
          ))
        )}
      </section>

      {/* ── Activity feed ── */}
      {activity.length > 0 && (
        <section className={styles.activitySection}>
          <div className={styles.scheduleTitleRow}>
            <h3 className={styles.sectionTitle}>{t('pro.dashboard.activityTitle')}</h3>
          </div>
          {activity.slice(0, 5).map((ev) => {
            const info = activityInfo(ev, t);
            return (
              <div key={ev.id} className={`${styles.activityRow} ${styles[`activity-${info.tone}`]}`}>
                <span className={styles.activityIcon}>{info.icon}</span>
                <div className={styles.activityBody}>
                  <span className={styles.activityLabel}>{info.label}</span>
                  <span className={styles.activityMeta}>
                    {ev.clients?.name ?? '—'}
                    {ev.services?.name ? ` · ${ev.services.name}` : ''}
                  </span>
                  {ev.cancel_reason && (
                    <span className={styles.activityReason}>«{ev.cancel_reason}»</span>
                  )}
                </div>
                <span className={styles.activityTime}>{relativeTime(ev.updated_at, t)}</span>
              </div>
            );
          })}
        </section>
      )}

      {/* ── Setup CTA (when not ready to publish) ── */}
      {!isPublished && businessActive !== null && (
        <section className={styles.setupCard}>
          <h3 className={styles.setupTitle}>
            {isReadyToPublish ? '🚀 ' + t('pro.dashboard.readyToPublish', 'Готово к публикации!') : '📋 ' + t('pro.dashboard.setupTitle', 'Настройте профиль')}
          </h3>
          {!isReadyToPublish && (
            <div className={styles.setupChecklist}>
              <div className={`${styles.setupItem} ${hasStaff ? styles.setupItemDone : ''}`}>
                <span className={styles.setupItemIcon}>{hasStaff ? '✅' : '⬜'}</span>
                <span className={styles.setupItemLabel}>{t('pro.dashboard.setupAddStaff', 'Добавьте мастера')}</span>
                {!hasStaff && (
                  <button className={styles.setupItemBtn} onClick={() => navigate('/pro/staff')}>
                    {t('common.add', 'Добавить')} →
                  </button>
                )}
              </div>
              <div className={`${styles.setupItem} ${hasServices ? styles.setupItemDone : ''}`}>
                <span className={styles.setupItemIcon}>{hasServices ? '✅' : '⬜'}</span>
                <span className={styles.setupItemLabel}>{t('pro.dashboard.setupAddService', 'Добавьте услугу')}</span>
                {!hasServices && (
                  <button className={styles.setupItemBtn} onClick={() => navigate('/pro/services')}>
                    {t('common.add', 'Добавить')} →
                  </button>
                )}
              </div>
            </div>
          )}
          {isReadyToPublish && (
            <p className={styles.setupDesc}>{t('pro.dashboard.readyDesc', 'Мастера и услуги добавлены. Опубликуйте профиль — клиенты смогут вас найти.')}</p>
          )}
          <button
            className={styles.publishBtn}
            onClick={handlePublish}
            disabled={!isReadyToPublish || publishing}
          >
            {publishing ? '...' : t('pro.dashboard.publishBtn', 'Опубликовать')}
          </button>
        </section>
      )}

      {/* ── Quick actions ── */}
      <section className={styles.quickActions}>
        <QuickAction icon={<QAIconScissors />} label={t('pro.more.services')} onClick={() => navigate('/pro/services')} />
        <QuickAction icon={<QAIconPerson />} label={t('pro.more.staff')} onClick={() => navigate('/pro/staff')} />
        <QuickAction icon={<QAIconClients />} label={t('pro.clients.title')} onClick={() => navigate('/pro/clients')} />
        <QuickAction icon={<QAIconSettings />} label={t('pro.more.profileSettings')} onClick={() => navigate('/pro/settings')} />
      </section>

      {toast && (
        <Toast key={toast.key} message={toast.msg} onDone={() => setToast(null)} />
      )}

      {/* ── Booking detail sheet ── */}
      <BottomSheet
        open={selectedBooking !== null}
        onClose={() => setSelectedBooking(null)}
        title={t('pro.dashboard.booking')}
      >
        {selectedBooking && (
          <div className={styles.detailSheet}>
            <p className={styles.detailTime}>
              {fmt(selectedBooking.starts_at, locale)} — {fmt(selectedBooking.ends_at, locale)}
              <span className={`${styles.detailStatusBadge} ${styles[`statusBadge-${selectedBooking.status}`]}`}>
                {selectedBooking.status === 'pending' && selectedBooking.rescheduled
                  ? `↻ ${t('pro.dashboard.rescheduleNotice')}`
                  : (STATUS_KEY_MAP[selectedBooking.status] ? t(STATUS_KEY_MAP[selectedBooking.status]) : selectedBooking.status)}
              </span>
            </p>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>{t('pro.dashboard.client')}</span>
              <span className={styles.detailValue}>{selectedBooking.clients?.name ?? '—'}</span>
            </div>
            {selectedBooking.clients?.phone && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>{t('pro.dashboard.phone')}</span>
                <a href={`tel:${selectedBooking.clients.phone}`} className={styles.detailPhone}>
                  📞 {selectedBooking.clients.phone}
                </a>
              </div>
            )}
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>{t('pro.dashboard.service')}</span>
              <span className={styles.detailValue}>{selectedBooking.services?.name ?? '—'}</span>
            </div>
            {staffMap.get(selectedBooking.master_id) && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>{t('pro.dashboard.master')}</span>
                <span className={styles.detailValue}>{staffMap.get(selectedBooking.master_id)}</span>
              </div>
            )}
            {selectedBooking.notes && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>{t('pro.dashboard.notes')}</span>
                <span className={styles.detailValue}>{selectedBooking.notes}</span>
              </div>
            )}

            <div className={styles.detailActions}>
              {selectedBooking.status === 'pending' && (
                <Button fullWidth loading={actionLoading} onClick={() => handleBookingAction('confirmed')}>
                  ✓ {t('pro.dashboard.confirm')}
                </Button>
              )}
              {selectedBooking.status === 'confirmed' && (
                <div className={styles.quickStatusRow}>
                  <button
                    className={styles.arrivedBtn}
                    disabled={actionLoading}
                    onClick={() => handleBookingAction('completed')}
                  >
                    ✓ {t('pro.dashboard.arrived')}
                  </button>
                  <button
                    className={styles.noShowBtn}
                    disabled={actionLoading}
                    onClick={() => handleBookingAction('no_show')}
                  >
                    ✗ {t('pro.dashboard.noShow')}
                  </button>
                </div>
              )}
              {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                <button
                  className={styles.cancelDetailBtn}
                  disabled={actionLoading}
                  onClick={() => handleBookingAction('cancelled')}
                >
                  {t('pro.dashboard.cancelBooking')}
                </button>
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </ProLayout>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function TodayRow({
  booking,
  masterName,
  onClick,
}: {
  booking: Booking;
  masterName?: string;
  onClick: () => void;
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'uz' ? 'uz-UZ' : 'ru-RU';
  const isReschedule = booking.status === 'pending' && booking.rescheduled;
  const shortLabel: Record<string, string> = {
    pending:   isReschedule ? '↻' : '⏳',
    confirmed: '✓',
    completed: '✓✓',
    cancelled: '✕',
    no_show:   '!',
  };

  return (
    <div
      className={`${styles.todayRow} ${styles[`todayRow-${booking.status}`]}`}
      onClick={onClick}
    >
      <span className={styles.todayTime}>{fmt(booking.starts_at, locale)}</span>
      <div className={styles.todayInfo}>
        <span className={styles.todayClient}>{booking.clients?.name ?? '—'}</span>
        <span className={styles.todayMeta}>
          {isReschedule ? `↻ ${t('pro.dashboard.rescheduleRequest')}` : (booking.services?.name ?? '—')}
          {masterName ? ` · ${masterName}` : ''}
        </span>
      </div>
      <span className={`${styles.todayBadge} ${styles[`statusBadge-${booking.status}`]}`}>
        {shortLabel[booking.status] ?? ''}
      </span>
    </div>
  );
}

type Tone = 'new' | 'confirmed' | 'cancelled' | 'completed' | 'noshow' | 'rescheduled';

function activityInfo(ev: ActivityEvent, t: (key: string) => string): { icon: string; label: string; tone: Tone } {
  const isRescheduled =
    ev.status === 'pending' &&
    Math.abs(new Date(ev.updated_at).getTime() - new Date(ev.created_at).getTime()) > 60_000;

  if (isRescheduled) return { icon: '↻', label: t('pro.dashboard.activityRescheduled'), tone: 'rescheduled' };
  switch (ev.status) {
    case 'pending':   return { icon: '●', label: t('pro.dashboard.activityNew'), tone: 'new' };
    case 'confirmed': return { icon: '✓', label: t('pro.dashboard.activityConfirmed'), tone: 'confirmed' };
    case 'cancelled': return {
      icon: '✕',
      label: ev.cancelled_by === 'client' ? t('pro.dashboard.activityCancelledByClient') : t('pro.dashboard.activityCancelled'),
      tone: 'cancelled',
    };
    case 'completed': return { icon: '✓', label: t('pro.dashboard.activityCompleted'), tone: 'completed' };
    case 'no_show':   return { icon: '!', label: t('pro.dashboard.activityNoShow'), tone: 'noshow' };
    default:          return { icon: '·', label: ev.status, tone: 'new' };
  }
}

function relativeTime(iso: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60_000);
  if (min < 1)  return t('pro.dashboard.justNow');
  if (min < 60) return t('pro.dashboard.minutesAgo', { min });
  const h = Math.floor(min / 60);
  if (h < 24)   return t('pro.dashboard.hoursAgo', { h });
  const d = Math.floor(h / 24);
  return d === 1 ? t('pro.dashboard.yesterday') : t('pro.dashboard.daysAgo', { d });
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button className={styles.quickAction} onClick={onClick}>
      <span className={styles.quickActionIcon}>{icon}</span>
      <span className={styles.quickActionLabel}>{label}</span>
    </button>
  );
}

const QAIconScissors = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
    <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12"/>
  </svg>
)

const QAIconPerson = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="7" r="4"/>
    <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6"/>
    <path d="M16 3.5c1.5.5 2.5 2 2 4-.5 1.5-2 2.5-3.5 2.5"/>
  </svg>
)

const QAIconClients = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="3.5"/>
    <path d="M3 20c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5"/>
    <circle cx="17" cy="8" r="2.5"/>
    <path d="M21 20c0-2.2-1.8-4-4-4"/>
  </svg>
)

const QAIconSettings = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
)
