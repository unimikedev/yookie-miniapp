import React, { useMemo } from 'react';
import { TimeSlot } from '@/lib/api/types';
import styles from './SlotGrid.module.css';

interface SlotGridProps {
  slots: TimeSlot[];
  selectedSlot: string | null;
  onSelect: (slot: TimeSlot) => void;
}

const parseTime = (timeStr: string): Date | null => {
  // Handle ISO datetime format (2026-04-05T10:00:00)
  if (timeStr.includes('T')) {
    return new Date(timeStr);
  }
  // Handle HH:mm format
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const date = new Date();
    date.setHours(parseInt(match[1]), parseInt(match[2]), 0, 0);
    return date;
  }
  return null;
};

const getTimeOfDay = (date: Date): 'morning' | 'afternoon' | 'evening' => {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

const formatTime = (timeStr: string): string => {
  const date = parseTime(timeStr);
  if (!date) return timeStr;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const isPastSlot = (slot: TimeSlot): boolean => {
  // Use ISO startsAt (slot.id) when available for accurate cross-date check.
  // Fallback to slot.start (HH:mm) — only reliable for today's slots.
  const checkStr = slot.id ?? slot.start;
  const date = parseTime(checkStr);
  if (!date) return false;
  return date.getTime() < Date.now();
};

type TimeOfDay = 'morning' | 'afternoon' | 'evening';

interface GroupedSlots {
  morning: TimeSlot[];
  afternoon: TimeSlot[];
  evening: TimeSlot[];
}

export const SlotGrid: React.FC<SlotGridProps> = ({ slots, selectedSlot, onSelect }) => {
  const groupedSlots = useMemo(() => {
    const grouped: GroupedSlots = {
      morning: [],
      afternoon: [],
      evening: [],
    };

    slots.forEach((slot) => {
      if (!slot.is_available) return;

      const date = parseTime(slot.start);
      if (!date) return;

      const timeOfDay = getTimeOfDay(date);
      grouped[timeOfDay].push(slot);
    });

    // Sort each group
    Object.keys(grouped).forEach((key) => {
      grouped[key as TimeOfDay].sort((a, b) => {
        const dateA = parseTime(a.start);
        const dateB = parseTime(b.start);
        if (!dateA || !dateB) return 0;
        return dateA.getTime() - dateB.getTime();
      });
    });

    return grouped;
  }, [slots]);

  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.is_available && !isPastSlot(slot)) {
      onSelect(slot);
    }
  };

  const renderSection = (
    title: string,
    sectionSlots: TimeSlot[],
  ) => {
    if (sectionSlots.length === 0) return null;

    return (
      <div key={title} className={styles.section}>
        <h4 className={styles.sectionTitle}>{title}</h4>
        <div className={styles.grid}>
          {sectionSlots.map((slot) => {
            const isSelected =
              selectedSlot === slot.id || selectedSlot === slot.start;
            const isPast = isPastSlot(slot);
            const time = formatTime(slot.start);

            return (
              <button
                key={slot.id || slot.start}
                className={`${styles.slot} ${isSelected ? styles.selected : ''} ${
                  isPast ? styles.disabled : ''
                }`}
                onClick={() => handleSlotClick(slot)}
                disabled={isPast}
                aria-label={`${time}${isPast ? ', unavailable' : ''}`}
                aria-pressed={isSelected}
              >
                {time}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {renderSection('Утром', groupedSlots.morning)}
      {renderSection('Днем', groupedSlots.afternoon)}
      {renderSection('Вечером', groupedSlots.evening)}

      {slots.length === 0 && (
        <div className={styles.empty}>Нет доступных слотов</div>
      )}
    </div>
  );
};
