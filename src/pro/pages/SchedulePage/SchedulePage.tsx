import { useEffect, useState } from 'react';
import { ProLayout } from '@/pro/components/ProLayout/ProLayout';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { listStaff, updateAvailability } from '@/pro/api';
import type { AvailabilityDay } from '@/pro/api';
import { mockGetAvailability } from '@/pro/api/proMocks';
import type { Master } from '@/lib/api/types';
import { Toast } from '@/components/ui/Toast';
import styles from './SchedulePage.module.css';

const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINS = ['00', '15', '30', '45'];

function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [hh = '09', mm = '00'] = value.split(':');
  return (
    <div className={styles.timeSelect}>
      <select
        className={styles.timeUnit}
        value={hh}
        onChange={e => onChange(`${e.target.value}:${mm}`)}
      >
        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <span className={styles.timeDot}>:</span>
      <select
        className={styles.timeUnit}
        value={mm}
        onChange={e => onChange(`${hh}:${e.target.value}`)}
      >
        {MINS.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>
  );
}

export default function SchedulePage() {
  const { merchantId } = useMerchantStore();
  const [staff, setStaff] = useState<Master[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<AvailabilityDay[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null);

  const showToast = (msg: string) => setToast({ msg, key: Date.now() });

  useEffect(() => {
    if (!merchantId) return;
    listStaff(merchantId).then((list) => {
      setStaff(list);
      if (list.length > 0 && !selectedStaff) setSelectedStaff(list[0].id);
    });
  }, [merchantId, selectedStaff]);

  useEffect(() => {
    if (!selectedStaff) return;
    setSchedule(mockGetAvailability(selectedStaff));
  }, [selectedStaff]);

  const toggleDay = (weekday: number) =>
    setSchedule(prev => prev.map(d => d.weekday === weekday ? { ...d, enabled: !d.enabled } : d));

  const updateTime = (weekday: number, field: 'open' | 'close', value: string) =>
    setSchedule(prev => prev.map(d => d.weekday === weekday ? { ...d, [field]: value } : d));

  const handleSave = async () => {
    if (!merchantId || !selectedStaff) return;
    setSaving(true);
    try {
      await updateAvailability(merchantId, selectedStaff, schedule);
      showToast('График сохранён');
    } catch {
      showToast('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProLayout title="График">
      {staff.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🗓</span>
          <p className={styles.emptyTitle}>Нет сотрудников</p>
          <p className={styles.emptyText}>Сначала добавьте мастеров в разделе «Сотрудники»</p>
        </div>
      ) : (
        <>
          {/* Staff selector */}
          <div className={styles.staffRow}>
            {staff.map(s => (
              <button
                key={s.id}
                className={`${styles.staffChip} ${selectedStaff === s.id ? styles.staffChipActive : ''}`}
                onClick={() => setSelectedStaff(s.id)}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* Schedule table */}
          <div className={styles.table}>
            {schedule.map(day => (
              <div key={day.weekday} className={`${styles.row} ${!day.enabled ? styles.rowDisabled : ''}`}>
                <button className={styles.toggle} onClick={() => toggleDay(day.weekday)}>
                  <span className={`${styles.dot} ${day.enabled ? styles.dotOn : ''}`} />
                  <span className={styles.dayLabel}>{WEEKDAYS[day.weekday]}</span>
                </button>
                {day.enabled ? (
                  <div className={styles.times}>
                    <TimeSelect value={day.open}  onChange={v => updateTime(day.weekday, 'open',  v)} />
                    <span className={styles.timeSep}>—</span>
                    <TimeSelect value={day.close} onChange={v => updateTime(day.weekday, 'close', v)} />
                  </div>
                ) : (
                  <span className={styles.offLabel}>Выходной</span>
                )}
              </div>
            ))}
          </div>

          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
        </>
      )}

      {toast && <Toast key={toast.key} message={toast.msg} onDone={() => setToast(null)} />}
    </ProLayout>
  );
}
