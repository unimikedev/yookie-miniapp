import { useEffect, useState } from 'react';
import { ProLayout } from '@/pro/components/ProLayout/ProLayout';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { listStaff, updateAvailability } from '@/pro/api';
import type { AvailabilityDay } from '@/pro/api';
import { mockGetAvailability } from '@/pro/api/proMocks';
import type { Master } from '@/lib/api/types';
import styles from './SchedulePage.module.css';

const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export default function SchedulePage() {
  const { merchantId } = useMerchantStore();
  const [staff, setStaff] = useState<Master[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<AvailabilityDay[]>([]);
  const [saving, setSaving] = useState(false);

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

  const toggleDay = (weekday: number) => {
    setSchedule((prev) =>
      prev.map((d) => (d.weekday === weekday ? { ...d, enabled: !d.enabled } : d))
    );
  };

  const updateTime = (weekday: number, field: 'open' | 'close', value: string) => {
    setSchedule((prev) =>
      prev.map((d) => (d.weekday === weekday ? { ...d, [field]: value } : d))
    );
  };

  const handleSave = async () => {
    if (!merchantId || !selectedStaff) return;
    setSaving(true);
    try {
      await updateAvailability(merchantId, selectedStaff, schedule);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProLayout title="График">
      {/* Staff selector */}
      <div className={styles.staffRow}>
        {staff.map((s) => (
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
        {schedule.map((day) => (
          <div key={day.weekday} className={`${styles.row} ${!day.enabled ? styles.rowDisabled : ''}`}>
            <button className={styles.toggle} onClick={() => toggleDay(day.weekday)}>
              <span className={`${styles.dot} ${day.enabled ? styles.dotOn : ''}`} />
              <span className={styles.dayLabel}>{WEEKDAYS[day.weekday]}</span>
            </button>
            {day.enabled ? (
              <div className={styles.times}>
                <input
                  type="time"
                  className={styles.timeInput}
                  value={day.open}
                  onChange={(e) => updateTime(day.weekday, 'open', e.target.value)}
                />
                <span className={styles.timeSep}>—</span>
                <input
                  type="time"
                  className={styles.timeInput}
                  value={day.close}
                  onChange={(e) => updateTime(day.weekday, 'close', e.target.value)}
                />
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
    </ProLayout>
  );
}
