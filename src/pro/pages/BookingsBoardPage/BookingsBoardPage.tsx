import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { ProLayout } from '@/pro/components/ProLayout/ProLayout';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { listBookings, listStaff, listServices, listClients, createBooking, updateBookingStatus, rescheduleBooking } from '@/pro/api';
import { subscribe, startPolling } from '@/pro/realtime';
import type { Booking, BookingStatus, Client, Master, Service } from '@/lib/api/types';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { ExportButton } from './ExportButton';
import styles from './BookingsBoardPage.module.css';

type ViewMode = 'timeline' | 'list';

const STATUS_LABELS: Record<string, string> = {
  pending:   'Ожидает',
  confirmed: 'Подтверждена',
  cancelled: 'Отменена',
  completed: 'Завершена',
  no_show:   'Не явился',
};

const START_HOUR = 8;
const END_HOUR   = 21;
const HOURS      = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const SLOT_H     = 64; // px per hour
const TOTAL_H    = HOURS.length * SLOT_H;

function toMin(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function minToTop(totalMin: number): number {
  return ((totalMin - START_HOUR * 60) / 60) * SLOT_H;
}

interface SlotTarget { staffId: string; staffName: string; hour: number; minute: number; }

const EMPTY_FORM = { clientName: '', clientPhone: '', serviceId: '', notes: '' };

function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s()-]/g, '');
  return cleaned.startsWith('+998') && cleaned.length >= 12;
}

export default function BookingsBoardPage() {
  const { merchantId } = useMerchantStore();
  const [bookings, setBookings]           = useState<Booking[]>([]);
  const [staff, setStaff]                 = useState<Master[]>([]);
  const [services, setServices]           = useState<Service[]>([]);
  const [date, setDate]                   = useState(() => new Date());
  const [view, setView]                   = useState<ViewMode>('timeline');
  const [dragging, setDragging]           = useState<string | null>(null);
  const [dragOverStaffId, setDragOverStaffId] = useState<string | null>(null);
  const [slotTarget, setSlotTarget]       = useState<SlotTarget | null>(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [saving, setSaving]               = useState(false);
  const [saveError, setSaveError]         = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError]     = useState<string | null>(null);
  const [clients, setClients]             = useState<Client[]>([]);
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);
  const [toast, setToast]                 = useState<{ msg: string; key: number } | null>(null);

  const showToast = (msg: string) => setToast({ msg, key: Date.now() });

  const dateStr  = useMemo(() => isoDate(date), [date]);
  const todayStr = useMemo(() => isoDate(new Date()), []);
  const isToday  = dateStr === todayStr;

  const load = useCallback(() => {
    if (!merchantId) return;
    listBookings(merchantId, { from: `${dateStr}T00:00:00`, to: `${dateStr}T23:59:59` })
      .then(setBookings).catch(() => {});
    listStaff(merchantId).then(setStaff).catch(() => {});
  }, [merchantId, dateStr]);

  useEffect(() => {
    if (!merchantId) return;
    listServices(merchantId).then(setServices).catch(() => {});
  }, [merchantId]);

  useEffect(() => {
    load();
    const unsub    = subscribe(ev => { if (ev.type.startsWith('booking.')) load(); });
    const stopPoll = startPolling(load, 15000);
    return () => { unsub(); stopPoll(); };
  }, [load]);

  // 7-day strip centred on selected date
  const stripDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(date); d.setDate(d.getDate() - 3 + i); return d;
  }), [dateStr]); // eslint-disable-line react-hooks/exhaustive-deps

  const prevDay = () => setDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; });
  const nextDay = () => setDate(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; });
  const goToday = () => setDate(new Date());

  const dateLabel = date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

  /* ── Drag & Drop ──────────────────────────────────────────────── */
  const handleDrop = async (e: React.DragEvent, staffId: string) => {
    e.preventDefault();
    setDragOverStaffId(null);
    if (!dragging || !merchantId) return;
    const booking = bookings.find(b => b.id === dragging);
    if (!booking) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minFromStart = Math.round((y / SLOT_H) * 60);
    const totalMin = START_HOUR * 60 + minFromStart;
    const hour   = Math.max(START_HOUR, Math.min(END_HOUR - 1, Math.floor(totalMin / 60)));
    const rawMin = Math.round((totalMin % 60) / 30) * 30;
    const minute = rawMin === 60 ? 0 : rawMin;

    const newStart = new Date(date);
    newStart.setHours(hour + (rawMin === 60 ? 1 : 0), minute, 0, 0);
    const duration = new Date(booking.ends_at).getTime() - new Date(booking.starts_at).getTime();
    const newEnd = new Date(newStart.getTime() + duration);

    const prev = bookings;
    setBookings(bs => bs.map(b =>
      b.id === dragging
        ? { ...b, starts_at: newStart.toISOString(), ends_at: newEnd.toISOString(), master_id: staffId }
        : b
    ));
    setDragging(null);

    try {
      await rescheduleBooking(merchantId, dragging, {
        startsAt: newStart.toISOString(),
        masterId: staffId !== booking.master_id ? staffId : undefined,
      });
      showToast('Запись перенесена');
    } catch {
      setBookings(prev);
    }
  };

  const handleSlotClick = (staffId: string, staffName: string, hour: number, minute: number) => {
    setSlotTarget({ staffId, staffName, hour, minute });
    setForm({ ...EMPTY_FORM, serviceId: services[0]?.id ?? '' });
    setSaveError(null);
    if (merchantId) listClients(merchantId).then(setClients).catch(() => {});
  };

  const handleCreateBooking = async () => {
    if (!merchantId || !slotTarget) return;
    if (!form.clientName.trim())  { setSaveError('Введите имя клиента'); return; }
    if (!form.clientPhone.trim()) { setSaveError('Введите телефон'); return; }
    if (!isValidPhone(form.clientPhone)) { setSaveError('Формат: +998 90 123-45-67'); return; }
    if (!form.serviceId)          { setSaveError('Выберите услугу'); return; }

    setSaving(true); setSaveError(null);
    try {
      const startsAt = new Date(date);
      startsAt.setHours(slotTarget.hour, slotTarget.minute, 0, 0);
      await createBooking({
        businessId: merchantId,
        masterId:   slotTarget.staffId,
        serviceId:  form.serviceId,
        startsAt:   startsAt.toISOString(),
        client:     { name: form.clientName.trim(), phone: form.clientPhone.trim() },
        notes:      form.notes.trim() || undefined,
      });
      setSlotTarget(null);
      load();
      showToast('Запись создана');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const handleBookingAction = async (status: BookingStatus) => {
    if (!selectedBooking || !merchantId) return;
    setActionLoading(true); setActionError(null);
    try {
      await updateBookingStatus(merchantId, selectedBooking.id, status);
      setSelectedBooking(null);
      load();
      const msgs: Partial<Record<BookingStatus, string>> = {
        confirmed: 'Запись подтверждена',
        cancelled: 'Запись отменена',
        completed: 'Визит завершён',
        no_show:   'Клиент не явился',
      };
      if (msgs[status]) showToast(msgs[status]!);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredStaff    = useMemo(() => selectedMasterId ? staff.filter(s => s.id === selectedMasterId) : staff, [staff, selectedMasterId]);
  const filteredBookings = useMemo(() => selectedMasterId ? bookings.filter(b => b.master_id === selectedMasterId) : bookings, [bookings, selectedMasterId]);

  const clientSuggestion = useMemo<Client | null>(() => {
    const raw = form.clientPhone.replace(/[\s()+-]/g, '');
    if (raw.length < 7) return null;
    return clients.find(c => c.phone?.replace(/[\s()+-]/g, '').includes(raw)) ?? null;
  }, [form.clientPhone, clients]);

  const dayCounts = useMemo(() => ({
    total:     bookings.filter(b => b.status !== 'cancelled' && b.status !== 'no_show').length,
    pending:   bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
  }), [bookings]);

  const actions = (
    <div className={styles.viewToggle}>
      <button className={`${styles.viewBtn} ${view === 'timeline' ? styles.viewBtnActive : ''}`} onClick={() => setView('timeline')}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="0" y="0" width="7" height="7" rx="1"/><rect x="9" y="0" width="7" height="7" rx="1"/><rect x="0" y="9" width="7" height="7" rx="1"/><rect x="9" y="9" width="7" height="7" rx="1"/></svg>
      </button>
      <button className={`${styles.viewBtn} ${view === 'list' ? styles.viewBtnActive : ''}`} onClick={() => setView('list')}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="0" y="2" width="16" height="2" rx="1"/><rect x="0" y="7" width="16" height="2" rx="1"/><rect x="0" y="12" width="16" height="2" rx="1"/></svg>
      </button>
    </div>
  );

  return (
    <ProLayout title="Записи" actions={actions}>

      {/* Date navigation */}
      <div className={styles.dateNav}>
        <button className={styles.dateArrow} onClick={prevDay}>‹</button>
        <div className={styles.dateLabelWrap}>
          <span className={styles.dateLabel} style={{ textTransform: 'capitalize' }}>{dateLabel}</span>
          {!isToday && <button className={styles.todayBtn} onClick={goToday}>Сегодня</button>}
        </div>
        <button className={styles.dateArrow} onClick={nextDay}>›</button>
      </div>

      {/* 7-day strip */}
      <div className={styles.dateStrip}>
        {stripDays.map(d => {
          const dStr = isoDate(d);
          return (
            <button
              key={dStr}
              className={`${styles.dayBtn} ${dStr === dateStr ? styles.dayBtnActive : ''} ${dStr === todayStr ? styles.dayBtnToday : ''}`}
              onClick={() => setDate(new Date(d))}
            >
              <span className={styles.dayName}>{d.toLocaleDateString('ru-RU', { weekday: 'short' })}</span>
              <span className={styles.dayNum}>{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      {/* Stats bar */}
      {dayCounts.total > 0 && (
        <div className={styles.statsBar}>
          <span className={styles.statItem}><span className={styles.statDot} style={{ background: 'var(--color-accent)' }} />{dayCounts.total} {dayCounts.total === 1 ? 'запись' : 'записей'}</span>
          {dayCounts.pending > 0   && <span className={styles.statItem}><span className={styles.statDot} style={{ background: '#FBBF24' }} />{dayCounts.pending} ожидает</span>}
          {dayCounts.confirmed > 0 && <span className={styles.statItem}><span className={styles.statDot} style={{ background: '#34D399' }} />{dayCounts.confirmed} подтверждено</span>}
        </div>
      )}

      {/* Master filter chips */}
      {staff.length > 1 && (
        <div className={styles.masterFilter}>
          <button className={`${styles.masterChip} ${selectedMasterId === null ? styles.masterChipActive : ''}`} onClick={() => setSelectedMasterId(null)}>Все</button>
          {staff.map(s => (
            <button
              key={s.id}
              className={`${styles.masterChip} ${selectedMasterId === s.id ? styles.masterChipActive : ''}`}
              onClick={() => setSelectedMasterId(s.id)}
            >{s.name.split(' ')[0]}</button>
          ))}
        </div>
      )}

      {/* Views */}
      {view === 'timeline' ? (
        <TimelineView
          hours={HOURS}
          staff={filteredStaff}
          bookings={filteredBookings}
          date={date}
          isToday={isToday}
          dragging={dragging}
          dragOverStaffId={dragOverStaffId}
          onDragStart={setDragging}
          onDragOverStaff={setDragOverStaffId}
          onDrop={handleDrop}
          onSlotClick={handleSlotClick}
          onBookingClick={setSelectedBooking}
        />
      ) : (
        <ListView bookings={filteredBookings} staff={staff} onBookingClick={setSelectedBooking} />
      )}

      {toast && <Toast key={toast.key} message={toast.msg} onDone={() => setToast(null)} />}

      {/* New booking sheet */}
      <BottomSheet open={slotTarget !== null} onClose={() => setSlotTarget(null)} title="Новая запись">
        {slotTarget && (
          <div className={styles.bookingForm}>
            <p className={styles.bookingFormMeta}>
              {String(slotTarget.hour).padStart(2, '0')}:{String(slotTarget.minute).padStart(2, '0')} · {slotTarget.staffName}
            </p>
            <input className={styles.formInput} placeholder="Имя клиента" value={form.clientName}
              onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} autoComplete="off" />
            <input className={styles.formInput} type="tel" placeholder="+998 90 000 00 00" value={form.clientPhone}
              onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))} maxLength={17} />
            {clientSuggestion && (
              <button type="button" className={styles.clientSuggestion}
                onClick={() => setForm(f => ({ ...f, clientPhone: clientSuggestion.phone ?? f.clientPhone, clientName: clientSuggestion.name ?? f.clientName }))}>
                ✓ {clientSuggestion.name} · {clientSuggestion.phone}
              </button>
            )}

            <p className={styles.servicePickerLabel}>Услуга</p>
            <div className={styles.servicePickerList}>
              {services.length === 0 && <p className={styles.servicePickerEmpty}>Нет услуг — добавьте в разделе «Услуги»</p>}
              {services.map(s => (
                <button key={s.id} type="button"
                  className={`${styles.serviceOption} ${form.serviceId === s.id ? styles.serviceOptionSelected : ''}`}
                  onClick={() => setForm(f => ({ ...f, serviceId: s.id }))}>
                  <span className={styles.serviceOptionName}>{s.name}</span>
                  <span className={styles.serviceOptionMeta}>{s.duration_min} мин · {s.price.toLocaleString('ru')} сўм</span>
                </button>
              ))}
            </div>

            <textarea className={styles.formInput} placeholder="Заметки (необязательно)" rows={2}
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            {saveError && <p className={styles.formError}>{saveError}</p>}
            <Button fullWidth loading={saving}
              disabled={!form.clientName.trim() || !form.clientPhone.trim() || !form.serviceId}
              onClick={handleCreateBooking}>Записать</Button>
          </div>
        )}
      </BottomSheet>

      {/* Booking detail sheet */}
      <BottomSheet open={selectedBooking !== null} onClose={() => { setSelectedBooking(null); setActionError(null); }} title="Запись">
        {selectedBooking && (
          <div className={styles.bookingDetail}>
            <div className={styles.detailHeader}>
              <div className={styles.detailTime}>{fmt(selectedBooking.starts_at)} — {fmt(selectedBooking.ends_at)}</div>
              <span className={`${styles.detailStatusBadge} ${styles[`badge-${selectedBooking.status}`]}`}>
                {selectedBooking.status === 'pending' && selectedBooking.rescheduled ? '↻ Перенос' : STATUS_LABELS[selectedBooking.status]}
              </span>
            </div>

            <div className={styles.detailCard}>
              <div className={styles.detailCardRow}>
                <span className={styles.detailIcon}>👤</span>
                <div className={styles.detailCardContent}>
                  <span className={styles.detailCardMain}>{selectedBooking.clients?.name ?? '—'}</span>
                  {selectedBooking.clients?.phone && (
                    <a href={`tel:${selectedBooking.clients.phone}`} className={styles.detailPhone}>{selectedBooking.clients.phone}</a>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.detailCard}>
              <div className={styles.detailCardRow}>
                <span className={styles.detailIcon}>✂️</span>
                <div className={styles.detailCardContent}>
                  <span className={styles.detailCardMain}>{selectedBooking.services?.name ?? '—'}</span>
                  {selectedBooking.services?.price && (
                    <span className={styles.detailCardSub}>{Number(selectedBooking.services.price).toLocaleString('ru')} сўм</span>
                  )}
                </div>
              </div>
            </div>

            {selectedBooking.status === 'pending' && selectedBooking.rescheduled && (
              <p className={styles.rescheduleHint}>Клиент запросил перенос. Подтвердите новое время или отмените.</p>
            )}
            {selectedBooking.notes && <div className={styles.detailNotes}>💬 {selectedBooking.notes}</div>}
            {actionError && <p className={styles.formError}>{actionError}</p>}

            <div className={styles.detailActions}>
              {selectedBooking.status === 'pending' && (
                <Button fullWidth loading={actionLoading} onClick={() => handleBookingAction('confirmed')}>✓ Подтвердить</Button>
              )}
              {selectedBooking.status === 'confirmed' && (
                <div className={styles.quickStatusRow}>
                  <button className={styles.arrivedBtn} disabled={actionLoading} onClick={() => handleBookingAction('completed')}>✓ Пришёл</button>
                  <button className={styles.noShowActionBtn} disabled={actionLoading} onClick={() => handleBookingAction('no_show')}>✗ Не явился</button>
                </div>
              )}
              {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                <button className={styles.cancelActionBtn} disabled={actionLoading} onClick={() => handleBookingAction('cancelled')}>Отменить запись</button>
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </ProLayout>
  );
}

/* ── Timeline ─────────────────────────────────────────────────────────────── */
interface TimelineProps {
  hours: number[];
  staff: Master[];
  bookings: Booking[];
  date: Date;
  isToday: boolean;
  dragging: string | null;
  dragOverStaffId: string | null;
  onDragStart: (id: string) => void;
  onDragOverStaff: (staffId: string | null) => void;
  onDrop: (e: React.DragEvent, staffId: string) => void;
  onSlotClick: (staffId: string, staffName: string, hour: number, minute: number) => void;
  onBookingClick: (booking: Booking) => void;
}

function TimelineView({ hours, staff, bookings, isToday, dragging, dragOverStaffId, onDragStart, onDragOverStaff, onDrop, onSlotClick, onBookingClick }: TimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [nowMin, setNowMin] = useState(() => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); });

  useEffect(() => {
    const t = setInterval(() => { const n = new Date(); setNowMin(n.getHours() * 60 + n.getMinutes()); }, 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!isToday || !scrollRef.current) return;
    scrollRef.current.scrollTop = Math.max(0, minToTop(nowMin) - 80);
  }, [isToday]); // eslint-disable-line react-hooks/exhaustive-deps

  const nowTop  = minToTop(nowMin);
  const colCount = staff.length || 1;

  const handleColumnClick = (e: React.MouseEvent, staffId: string, staffName: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minFromStart = Math.round((y / SLOT_H) * 60);
    const totalMin = START_HOUR * 60 + minFromStart;
    const hour   = Math.max(START_HOUR, Math.min(END_HOUR - 1, Math.floor(totalMin / 60)));
    const rawMin = Math.round((totalMin % 60) / 30) * 30;
    const minute = rawMin === 60 ? 0 : rawMin;
    onSlotClick(staffId, staffName, hour, minute);
  };

  if (staff.length === 0) {
    return (
      <div className={styles.emptyDay}>
        <span className={styles.emptyDayIcon}>👤</span>
        <p className={styles.emptyDayText}>Добавьте мастеров чтобы вести расписание</p>
      </div>
    );
  }

  return (
    <div className={styles.timeline}>
      {/* Sticky staff header */}
      <div className={styles.staffHeader} style={{ gridTemplateColumns: `48px repeat(${colCount}, minmax(72px, 1fr))` }}>
        <span />
        {staff.map(s => (
          <div key={s.id} className={styles.staffHeaderCell}>
            <div className={styles.staffAvatar}>{s.name.trim().charAt(0).toUpperCase()}</div>
            <span className={styles.staffName}>{s.name.split(' ')[0]}</span>
          </div>
        ))}
      </div>

      {/* Scrollable body */}
      <div className={styles.timelineBody} ref={scrollRef}>
        <div className={styles.hoursCol}>
          {hours.map(h => <div key={h} className={styles.hourMark}>{String(h).padStart(2, '0')}:00</div>)}
        </div>

        <div className={styles.columnsArea} style={{ gridTemplateColumns: `repeat(${colCount}, minmax(72px, 1fr))` }}>
          {staff.map(s => {
            const colBookings = bookings.filter(b => b.master_id === s.id);
            return (
              <div
                key={s.id}
                className={`${styles.staffCol} ${dragOverStaffId === s.id ? styles.staffColDragOver : ''}`}
                style={{ height: TOTAL_H }}
                onClick={e => handleColumnClick(e, s.id, s.name)}
                onDragOver={e => { e.preventDefault(); onDragOverStaff(s.id); }}
                onDragLeave={() => onDragOverStaff(null)}
                onDrop={e => onDrop(e, s.id)}
              >
                {hours.map(h => (
                  <div key={h} className={styles.hourLine} style={{ top: (h - START_HOUR) * SLOT_H }}>
                    <div className={styles.halfHourLine} style={{ top: SLOT_H / 2 }} />
                  </div>
                ))}
                <div className={styles.colHint}>+ Запись</div>
                {colBookings.map(b => (
                  <BookingCard key={b.id} booking={b} isDragging={dragging === b.id}
                    onDragStart={() => onDragStart(b.id)} onClick={() => onBookingClick(b)} />
                ))}
              </div>
            );
          })}

          {isToday && nowTop >= 0 && nowTop <= TOTAL_H && (
            <div className={styles.nowLine} style={{ top: nowTop }}>
              <div className={styles.nowDot} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Booking Card ─────────────────────────────────────────────────────────── */
function BookingCard({ booking, isDragging, onDragStart, onClick }: { booking: Booking; isDragging: boolean; onDragStart: () => void; onClick: () => void }) {
  const startMin    = toMin(booking.starts_at);
  const endMin      = toMin(booking.ends_at);
  const durationMin = endMin - startMin;
  const top         = minToTop(startMin);
  const height      = Math.max(26, (durationMin / 60) * SLOT_H);
  const isCompact   = height < 48;
  const isTiny      = height < 30;
  const isReschedule = booking.status === 'pending' && booking.rescheduled;

  return (
    <div
      className={`${styles.bookingCard} ${styles[`status-${booking.status}`] ?? ''} ${isReschedule ? styles.bookingCardReschedule : ''} ${isDragging ? styles.bookingCardDragging : ''}`}
      style={{ top, height, position: 'absolute', left: 3, right: 3 }}
      draggable
      onDragStart={e => { e.stopPropagation(); onDragStart(); }}
      onClick={e => { e.stopPropagation(); onClick(); }}
    >
      {!isTiny    && <span className={styles.cardTime}>{fmt(booking.starts_at)}</span>}
      {!isCompact && <span className={styles.cardClient}>{booking.clients?.name ?? '—'}</span>}
      {!isCompact && <span className={styles.cardService}>{isReschedule ? '↻ Перенос' : (booking.services?.name ?? '—')}</span>}
    </div>
  );
}

/* ── Agenda list view ─────────────────────────────────────────────────────── */
function ListView({ bookings, staff, onBookingClick }: { bookings: Booking[]; staff: Master[]; onBookingClick: (b: Booking) => void }) {
  const sorted   = [...bookings].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const staffMap = new Map(staff.map(s => [s.id, s.name]));

  if (sorted.length === 0) {
    return (
      <div className={styles.emptyDay}>
        <span className={styles.emptyDayIcon}>📋</span>
        <p className={styles.emptyDayText}>Нет записей на этот день</p>
      </div>
    );
  }

  return (
    <div className={styles.agendaList}>
      {sorted.map(b => {
        const isReschedule = b.status === 'pending' && b.rescheduled;
        return (
          <div key={b.id}
            className={`${styles.agendaItem} ${styles[`agendaBorder-${b.status}`] ?? ''}`}
            onClick={() => onBookingClick(b)}>
            <div className={styles.agendaTime}>
              <span className={styles.agendaStart}>{fmt(b.starts_at)}</span>
              <span className={styles.agendaEnd}>{fmt(b.ends_at)}</span>
            </div>
            <div className={styles.agendaInfo}>
              <span className={styles.agendaClient}>{b.clients?.name ?? '—'}</span>
              <span className={styles.agendaService}>{isReschedule ? '↻ Запрос на перенос' : (b.services?.name ?? '—')}</span>
              <span className={styles.agendaMaster}>{staffMap.get(b.master_id) ?? ''}</span>
            </div>
            <span className={`${styles.agendaStatusDot} ${styles[`dot-${b.status}`]}`} />
          </div>
        );
      })}
    </div>
  );
}
