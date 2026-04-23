import { useEffect, useState, useMemo, useCallback } from 'react';
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
  pending: 'Ожидает подтверждения',
  confirmed: 'Подтверждена',
  cancelled: 'Отменена',
  completed: 'Завершена',
  no_show: 'Не явился',
};

function getStatusLabel(booking: Booking): string {
  if (booking.status === 'pending' && booking.rescheduled) return 'Запрос на перенос'
  return STATUS_LABELS[booking.status] ?? booking.status
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 — 20:00
const SLOT_HEIGHT = 60; // px per hour

function toMinutes(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface SlotTarget {
  staffId: string;
  staffName: string;
  hour: number;
}

const EMPTY_FORM = { clientName: '', clientPhone: '', serviceId: '', notes: '' };

// Phone validation regex for Uzbekistan format: +998 XX XXX-XX-XX or similar
const PHONE_REGEX = /^\+998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/;
const PHONE_MIN_LENGTH = 12; // +998 + 9 digits minimum

function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s()-]/g, '');
  return cleaned.startsWith('+998') && cleaned.length >= 12 && PHONE_MIN_LENGTH <= cleaned.length;
}

export default function BookingsBoardPage() {
  const { merchantId } = useMerchantStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staff, setStaff] = useState<Master[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [date, setDate] = useState(() => new Date());
  const [view, setView] = useState<ViewMode>('timeline');
  const [dragging, setDragging] = useState<string | null>(null);
  const [slotTarget, setSlotTarget] = useState<SlotTarget | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null);

  const showToast = (msg: string) => setToast({ msg, key: Date.now() });

  const dateStr = useMemo(() => isoDate(date), [date]);

  const load = useCallback(() => {
    if (!merchantId) return;
    const from = `${dateStr}T00:00:00`;
    const to = `${dateStr}T23:59:59`;
    listBookings(merchantId, { from, to }).then(setBookings).catch(() => {});
    listStaff(merchantId).then(setStaff).catch(() => {});
  }, [merchantId, dateStr]);

  useEffect(() => {
    if (!merchantId) return;
    listServices(merchantId).then(setServices).catch(() => {});
  }, [merchantId]);

  useEffect(() => {
    load();
    const unsub = subscribe((ev) => {
      if (ev.type.startsWith('booking.')) load();
    });
    const stopPoll = startPolling(load, 15000);
    return () => { unsub(); stopPoll(); };
  }, [load]);

  const prevDay = () => setDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; });
  const nextDay = () => setDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; });

  const dateLabel = date.toLocaleDateString('ru-RU', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  /* ── Drag & Drop handlers (pointer-based, touch friendly) ──────────── */
  const handleDragStart = (bookingId: string) => {
    setDragging(bookingId);
  };

  const handleDrop = async (staffId: string, hour: number) => {
    if (!dragging || !merchantId) return;
    const booking = bookings.find((b) => b.id === dragging);
    if (!booking) return;

    const duration = (new Date(booking.ends_at).getTime() - new Date(booking.starts_at).getTime());
    const newStart = new Date(date);
    newStart.setHours(hour, 0, 0, 0);
    const newEnd = new Date(newStart.getTime() + duration);

    const prevBookings = bookings;
    setBookings((prev) =>
      prev.map((b) =>
        b.id === dragging
          ? { ...b, starts_at: newStart.toISOString(), ends_at: newEnd.toISOString(), master_id: staffId }
          : b
      )
    );
    setDragging(null);

    try {
      await rescheduleBooking(merchantId, dragging, {
        startsAt: newStart.toISOString(),
        masterId: staffId !== booking.master_id ? staffId : undefined,
      });
    } catch {
      setBookings(prevBookings);
    }
  };

  const handleSlotClick = (staffId: string, staffName: string, hour: number) => {
    setSlotTarget({ staffId, staffName, hour });
    setForm({ ...EMPTY_FORM, serviceId: services[0]?.id ?? '' });
    setSaveError(null);
    // Load clients for phone-search autocomplete
    if (merchantId) listClients(merchantId).then(setClients).catch(() => {});
  };

  const handleCreateBooking = async () => {
    if (!merchantId || !slotTarget) return;
    const { clientName, clientPhone, serviceId } = form;
    
    // Validate required fields
    if (!clientName.trim()) {
      setSaveError('Введите имя клиента');
      return;
    }
    
    if (!clientPhone.trim()) {
      setSaveError('Введите телефон клиента');
      return;
    }
    
    // Validate phone format
    if (!isValidPhone(clientPhone)) {
      setSaveError('Введите корректный номер телефона (например, +998 90 123-45-67)');
      return;
    }
    
    if (!serviceId) {
      setSaveError('Выберите услугу');
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const startsAt = new Date(date);
      startsAt.setHours(slotTarget.hour, 0, 0, 0);

      await createBooking({
        businessId: merchantId,
        masterId: slotTarget.staffId,
        serviceId,
        startsAt: startsAt.toISOString(),
        client: { name: clientName.trim(), phone: clientPhone.trim() },
        notes: form.notes.trim() || undefined,
      });

      setSlotTarget(null);
      load();
      showToast('Запись создана');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Ошибка создания записи');
    } finally {
      setSaving(false);
    }
  };

  const handleBookingAction = async (status: BookingStatus) => {
    if (!selectedBooking || !merchantId) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await updateBookingStatus(merchantId, selectedBooking.id, status);
      setSelectedBooking(null);
      load();
      const toastMsg: Record<BookingStatus, string> = {
        confirmed: 'Запись подтверждена',
        cancelled: 'Запись отменена',
        completed: 'Визит завершён',
        no_show:   'Клиент не явился',
        pending:   '',
      };
      if (toastMsg[status]) showToast(toastMsg[status]);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredStaff = useMemo(
    () => selectedMasterId ? staff.filter(s => s.id === selectedMasterId) : staff,
    [staff, selectedMasterId],
  );
  const filteredBookings = useMemo(
    () => selectedMasterId ? bookings.filter(b => b.master_id === selectedMasterId) : bookings,
    [bookings, selectedMasterId],
  );

  // Find existing client by phone prefix (for autocomplete)
  const clientSuggestion = useMemo<Client | null>(() => {
    const raw = form.clientPhone.replace(/[\s()+-]/g, '');
    if (raw.length < 7) return null;
    return clients.find(c => c.phone?.replace(/[\s()+-]/g, '').includes(raw)) ?? null;
  }, [form.clientPhone, clients]);

  const actions = (
    <div className={styles.viewToggle}>
      <button
        className={`${styles.viewBtn} ${view === 'timeline' ? styles.viewBtnActive : ''}`}
        onClick={() => setView('timeline')}
      >
        ▦
      </button>
      <button
        className={`${styles.viewBtn} ${view === 'list' ? styles.viewBtnActive : ''}`}
        onClick={() => setView('list')}
      >
        ☰
      </button>
    </div>
  );

  return (
    <ProLayout title="Записи" actions={actions}>
      {/* Date nav */}
      <div className={styles.dateNav}>
        <button className={styles.dateArrow} onClick={prevDay}>‹</button>
        <span className={styles.dateLabel}>{dateLabel}</span>
        <button className={styles.dateArrow} onClick={nextDay}>›</button>
      </div>

      {/* Master filter chips */}
      {staff.length > 1 && (
        <div className={styles.masterFilter}>
          <button
            className={`${styles.masterChip} ${selectedMasterId === null ? styles.masterChipActive : ''}`}
            onClick={() => setSelectedMasterId(null)}
          >
            Все
          </button>
          {staff.map(s => (
            <button
              key={s.id}
              className={`${styles.masterChip} ${selectedMasterId === s.id ? styles.masterChipActive : ''}`}
              onClick={() => setSelectedMasterId(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {view === 'timeline' ? (
        <TimelineView
          hours={HOURS}
          staff={filteredStaff}
          bookings={filteredBookings}
          dragging={dragging}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          onSlotClick={handleSlotClick}
          onBookingClick={setSelectedBooking}
        />
      ) : (
        <ListView bookings={filteredBookings} staff={staff} onBookingClick={setSelectedBooking} />
      )}

      {toast && (
        <Toast key={toast.key} message={toast.msg} onDone={() => setToast(null)} />
      )}

      <BottomSheet
        open={slotTarget !== null}
        onClose={() => setSlotTarget(null)}
        title="Новая запись"
      >
        {slotTarget && (
          <div className={styles.bookingForm}>
            <p className={styles.bookingFormMeta}>
              {String(slotTarget.hour).padStart(2, '0')}:00 · {slotTarget.staffName}
            </p>

            <input
              className={styles.formInput}
              placeholder="Имя клиента"
              value={form.clientName}
              onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
            />
            <input
              className={styles.formInput}
              type="tel"
              placeholder="+998 90 000 00 00"
              value={form.clientPhone}
              onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))}
              maxLength={17}
            />
            {clientSuggestion && (
              <button
                type="button"
                className={styles.clientSuggestion}
                onClick={() => setForm(f => ({
                  ...f,
                  clientPhone: clientSuggestion.phone ?? f.clientPhone,
                  clientName:  clientSuggestion.name  ?? f.clientName,
                }))}
              >
                ✓ {clientSuggestion.name} · {clientSuggestion.phone}
              </button>
            )}
            <select
              className={styles.formInput}
              value={form.serviceId}
              onChange={(e) => setForm((f) => ({ ...f, serviceId: e.target.value }))}
            >
              {services.length === 0 && (
                <option value="">Нет услуг — добавьте услугу</option>
              )}
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.duration_min} мин
                </option>
              ))}
            </select>
            <textarea
              className={styles.formInput}
              placeholder="Заметки (необязательно)"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />

            {saveError && <p className={styles.formError}>{saveError}</p>}

            <Button
              fullWidth
              loading={saving}
              disabled={!form.clientName.trim() || !form.clientPhone.trim() || !form.serviceId}
              onClick={handleCreateBooking}
            >
              Записать
            </Button>
          </div>
        )}
      </BottomSheet>
      <BottomSheet
        open={selectedBooking !== null}
        onClose={() => { setSelectedBooking(null); setActionError(null); }}
        title="Запись"
      >
        {selectedBooking && (
          <div className={styles.bookingForm}>
            <p className={styles.bookingFormMeta}>
              {fmt(selectedBooking.starts_at)} — {fmt(selectedBooking.ends_at)}
            </p>
            <div className={styles.bookingDetailRow}>
              <span className={styles.bookingDetailLabel}>Клиент</span>
              <span>{selectedBooking.clients?.name ?? '—'}</span>
            </div>
            <div className={styles.bookingDetailRow}>
              <span className={styles.bookingDetailLabel}>Телефон</span>
              {selectedBooking.clients?.phone ? (
                <a href={`tel:${selectedBooking.clients.phone}`} className={styles.phoneLink}>
                  📞 {selectedBooking.clients.phone}
                </a>
              ) : <span>—</span>}
            </div>
            <div className={styles.bookingDetailRow}>
              <span className={styles.bookingDetailLabel}>Услуга</span>
              <span>{selectedBooking.services?.name ?? '—'}</span>
            </div>
            <div className={styles.bookingDetailRow}>
              <span className={styles.bookingDetailLabel}>Статус</span>
              <span className={selectedBooking.status === 'pending' && selectedBooking.rescheduled ? styles.rescheduleStatus : ''}>
                {getStatusLabel(selectedBooking)}
              </span>
            </div>
            {selectedBooking.status === 'pending' && selectedBooking.rescheduled && (
              <p className={styles.rescheduleHint}>Клиент запросил перенос записи. Подтвердите или отмените.</p>
            )}
            {selectedBooking.notes && (
              <div className={styles.bookingDetailRow}>
                <span className={styles.bookingDetailLabel}>Заметки</span>
                <span>{selectedBooking.notes}</span>
              </div>
            )}

            {actionError && <p className={styles.formError}>{actionError}</p>}

            <div className={styles.actionRow}>
              {selectedBooking.status === 'pending' && (
                <Button
                  fullWidth
                  loading={actionLoading}
                  onClick={() => handleBookingAction('confirmed')}
                >
                  ✓ Подтвердить
                </Button>
              )}
              {selectedBooking.status === 'confirmed' && (
                <div className={styles.quickStatusRow}>
                  <button
                    className={styles.arrivedBtn}
                    disabled={actionLoading}
                    onClick={() => handleBookingAction('completed')}
                  >
                    ✓ Пришёл
                  </button>
                  <button
                    className={styles.noShowActionBtn}
                    disabled={actionLoading}
                    onClick={() => handleBookingAction('no_show')}
                  >
                    ✗ Не явился
                  </button>
                </div>
              )}
              {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                <button
                  className={styles.cancelActionBtn}
                  disabled={actionLoading}
                  onClick={() => handleBookingAction('cancelled')}
                >
                  Отменить запись
                </button>
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </ProLayout>
  );
}

/* ── Timeline ────────────────────────────────────────────────────────────── */
interface TimelineProps {
  hours: number[];
  staff: Master[];
  bookings: Booking[];
  dragging: string | null;
  onDragStart: (id: string) => void;
  onDrop: (staffId: string, hour: number) => void;
  onSlotClick: (staffId: string, staffName: string, hour: number) => void;
  onBookingClick: (booking: Booking) => void;
}

function TimelineView({ hours, staff, bookings, dragging, onDragStart, onDrop, onSlotClick, onBookingClick }: TimelineProps) {
  const colCount = staff.length || 1;

  return (
    <div className={styles.timeline}>
      {/* Staff header */}
      <div className={styles.staffHeader} style={{ gridTemplateColumns: `56px repeat(${colCount}, 1fr)` }}>
        <span />
        {staff.map((s) => (
          <span key={s.id} className={styles.staffName}>{s.name}</span>
        ))}
      </div>

      {/* Grid body */}
      <div className={styles.grid} style={{ gridTemplateColumns: `56px repeat(${colCount}, 1fr)` }}>
        {hours.map((h) => (
          <div key={h} className={styles.hourRow} style={{ gridColumn: '1 / -1', gridRow: h - 7 }}>
            <span className={styles.hourLabel}>{String(h).padStart(2, '0')}:00</span>
            {staff.map((s) => {
              const slotBookings = bookings.filter(
                (b) => b.master_id === s.id && toMinutes(b.starts_at) < (h + 1) * 60 && toMinutes(b.ends_at) > h * 60
              );
              return (
                <div
                  key={s.id}
                  className={`${styles.cell} ${dragging ? styles.cellDrop : ''}`}
                  onClick={() => slotBookings.length === 0 && onSlotClick(s.id, s.name, h)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(s.id, h)}
                >
                  {slotBookings.map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      onDragStart={() => onDragStart(b.id)}
                      onClick={() => onBookingClick(b)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Booking Card ────────────────────────────────────────────────────────── */
function BookingCard({ booking, onDragStart, onClick }: { booking: Booking; onDragStart: () => void; onClick: () => void }) {
  const statusClass = styles[`status-${booking.status}`] ?? '';
  const isReschedule = booking.status === 'pending' && booking.rescheduled;

  return (
    <div
      className={`${styles.bookingCard} ${statusClass} ${isReschedule ? styles.bookingCardReschedule : ''}`}
      draggable
      onDragStart={onDragStart}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      <span className={styles.cardTime}>{fmt(booking.starts_at)}</span>
      <span className={styles.cardClient}>{booking.clients?.name ?? '—'}</span>
      <span className={styles.cardService}>{isReschedule ? '↻ Перенос' : (booking.services?.name ?? '—')}</span>
    </div>
  );
}

/* ── List fallback ───────────────────────────────────────────────────────── */
function ListView({ bookings, staff, onBookingClick }: { bookings: Booking[]; staff: Master[]; onBookingClick: (b: Booking) => void }) {
  const sorted = [...bookings].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );
  const staffMap = new Map(staff.map((s) => [s.id, s.name]));

  return (
    <div className={styles.list}>
      {sorted.length === 0 && (
        <p className={styles.empty}>Нет записей на этот день</p>
      )}
      {sorted.map((b) => (
        <div key={b.id} className={styles.listItem} onClick={() => onBookingClick(b)} style={{ cursor: 'pointer' }}>
          <span className={styles.listTime}>{fmt(b.starts_at)} — {fmt(b.ends_at)}</span>
          <span className={styles.listClient}>{b.clients?.name ?? '—'}</span>
          <span className={styles.listService}>{b.services?.name ?? '—'}</span>
          <span className={styles.listStaff}>{staffMap.get(b.master_id) ?? '—'}</span>
          <span className={`${styles.listStatus} ${styles[`status-${b.status}`] ?? ''}`}>
            {STATUS_LABELS[b.status] ?? b.status}
          </span>
        </div>
      ))}
    </div>
  );
}
