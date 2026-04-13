import React, { useRef, useEffect } from 'react';
import { format, addDays, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import styles from './DatePicker.module.css';

interface DatePickerProps {
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

const getDayOfWeekShort = (date: Date): string => {
  return format(date, 'EEE', { locale: ru }).slice(0, 2).toUpperCase();
};

const getDayNumber = (date: Date): number => {
  return date.getDate();
};

const getMonthShort = (date: Date): string => {
  return format(date, 'MMM', { locale: ru });
};

export const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedDayRef = useRef<HTMLButtonElement>(null);

  // Generate dates for next 14 days
  const today = new Date();
  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(today, i);
    return {
      date,
      dateStr: format(date, 'yyyy-MM-dd'),
      dayOfWeek: getDayOfWeekShort(date),
      dayNumber: getDayNumber(date),
      month: getMonthShort(date),
      isToday: isToday(date),
    };
  });

  // Scroll selected date into view
  useEffect(() => {
    if (selectedDayRef.current && containerRef.current) {
      const selected = selectedDayRef.current;
      const container = containerRef.current;

      setTimeout(() => {
        const scrollLeft = selected.offsetLeft - container.clientWidth / 2 + selected.clientWidth / 2;
        container.scrollLeft = Math.max(0, scrollLeft);
      }, 100);
    }
  }, [selectedDate]);

  // Set default to today if not selected
  useEffect(() => {
    if (!selectedDate) {
      onSelect(format(today, 'yyyy-MM-dd'));
    }
  }, []);

  return (
    <div className={styles.container} ref={containerRef}>
      {dates.map(({ dateStr, dayOfWeek, dayNumber, month, isToday: isTodayDate }) => {
        const isSelected = selectedDate === dateStr;
        const isDifferentMonth = dayNumber === 1 && !isTodayDate;

        return (
          <button
            key={dateStr}
            ref={isSelected ? selectedDayRef : null}
            className={`${styles.day} ${isSelected ? styles.selected : ''}`}
            onClick={() => onSelect(dateStr)}
            aria-label={`${dayNumber} ${month}${isTodayDate ? ', today' : ''}`}
            aria-pressed={isSelected}
          >
            <div className={styles.dayOfWeek}>{dayOfWeek}</div>
            <div className={styles.dayNumber}>{dayNumber}</div>
            {isDifferentMonth && <div className={styles.month}>{month}</div>}
            {isTodayDate && <div className={styles.today}>Сегодня</div>}
          </button>
        );
      })}
    </div>
  );
};
