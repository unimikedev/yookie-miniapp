import { useEffect, useState, useMemo, useCallback } from 'react';
import { ProLayout } from '@/pro/components/ProLayout/ProLayout';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { listBookings, listStaff } from '@/pro/api';
import { subscribe, startPolling } from '@/pro/realtime';
import type { Booking, Master } from '@/lib/api/types';
import styles from './BookingsBoardPage.module.css';

type ViewMode = 'timeline' | 'list';

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

export default function BookingsBoardPage() {
  const { merchantId } = useMerchantStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staff, setStaff] = useState<Master[]>([]);
  const [date, setDate] = useState(() => new Date());
  const [view, setView] = useState<ViewMode>('timeline');
  const [dragging, setDragging] = useState<string | null>(null);

  const dateStr = useMemo(() => isoDate(date), [date]);

  const load = useCallback(() => {
    if (!merchantId) return;
    const from = `${dateStr}T00:00:00`;
    const to = `${dateStr}T23:59:59`;
    listBookings(merchantId, { from, to }).then(setBookings).catch(() => {});
    listStaff(merchantId).then(setStaff).catch(() => {});
  }, [merchantId, dateStr]);

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

  const handleDrop = (staffId: string, hour: number) => {
    if (!dragging || !merchantId) return;
    const booking = bookings.find((b) => b.id === dragging);
    if (!booking) return;

    const duration = (new Date(booking.ends_at).getTime() - new Date(booking.starts_at).getTime());
    const newStart = new Date(date);
    newStart.setHours(hour, 0, 0, 0);
    const newEnd = new Date(newStart.getTime() + duration);

    // Optimistic update
    setBookings((prev) =>
      prev.map((b) =>
        b.id === dragging
          ? { ...b, starts_at: newStart.toISOString(), ends_at: newEnd.toISOString(), master_id: staffId }
          : b
      )
    );
    setDragging(null);
  };

  const handleSlotClick = (staffId: string, hour: number) => {
    // Navigate to new-booking bottom sheet (future)
    console.log('[Pro] create booking', { staffId, hour, date: dateStr });
  };

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

      {view === 'timeline' ? (
        <TimelineView
          hours={HOURS}
          staff={staff}
          bookings={bookings}
          dragging={dragging}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          onSlotClick={handleSlotClick}
        />
      ) : (
        <ListView bookings={bookings} staff={staff} />
      )}
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
  onSlotClick: (staffId: string, hour: number) => void;
}

function TimelineView({ hours, staff, bookings, dragging, onDragStart, onDrop, onSlotClick }: TimelineProps) {
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
                  onClick={() => slotBookings.length === 0 && onSlotClick(s.id, h)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(s.id, h)}
                >
                  {slotBookings.map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      onDragStart={() => onDragStart(b.id)}
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
function BookingCard({ booking, onDragStart }: { booking: Booking; onDragStart: () => void }) {
  const statusClass = styles[`status-${booking.status}`] ?? '';

  return (
    <div
      className={`${styles.bookingCard} ${statusClass}`}
      draggable
      onDragStart={onDragStart}
    >
      <span className={styles.cardTime}>{fmt(booking.starts_at)}</span>
      <span className={styles.cardClient}>{booking.clients?.name ?? '—'}</span>
      <span className={styles.cardService}>{booking.services?.name ?? '—'}</span>
    </div>
  );
}

/* ── List fallback ───────────────────────────────────────────────────────── */
function ListView({ bookings, staff }: { bookings: Booking[]; staff: Master[] }) {
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
        <div key={b.id} className={styles.listItem}>
          <span className={styles.listTime}>{fmt(b.starts_at)} — {fmt(b.ends_at)}</span>
          <span className={styles.listClient}>{b.clients?.name ?? '—'}</span>
          <span className={styles.listService}>{b.services?.name ?? '—'}</span>
          <span className={styles.listStaff}>{staffMap.get(b.master_id) ?? '—'}</span>
          <span className={`${styles.listStatus} ${styles[`status-${b.status}`] ?? ''}`}>
            {b.status}
          </span>
        </div>
      ))}
    </div>
  );
}
