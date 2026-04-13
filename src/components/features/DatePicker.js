import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useRef, useEffect } from 'react';
import { format, addDays, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import styles from './DatePicker.module.css';
const getDayOfWeekShort = (date) => {
    return format(date, 'EEE', { locale: ru }).slice(0, 2).toUpperCase();
};
const getDayNumber = (date) => {
    return date.getDate();
};
const getMonthShort = (date) => {
    return format(date, 'MMM', { locale: ru });
};
export const DatePicker = ({ selectedDate, onSelect }) => {
    const containerRef = useRef(null);
    const selectedDayRef = useRef(null);
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
    return (_jsx("div", { className: styles.container, ref: containerRef, children: dates.map(({ dateStr, dayOfWeek, dayNumber, month, isToday: isTodayDate }) => {
            const isSelected = selectedDate === dateStr;
            const isDifferentMonth = dayNumber === 1 && !isTodayDate;
            return (_jsxs("button", { ref: isSelected ? selectedDayRef : null, className: `${styles.day} ${isSelected ? styles.selected : ''}`, onClick: () => onSelect(dateStr), "aria-label": `${dayNumber} ${month}${isTodayDate ? ', today' : ''}`, "aria-pressed": isSelected, children: [_jsx("div", { className: styles.dayOfWeek, children: dayOfWeek }), _jsx("div", { className: styles.dayNumber, children: dayNumber }), isDifferentMonth && _jsx("div", { className: styles.month, children: month }), isTodayDate && _jsx("div", { className: styles.today, children: "\u0421\u0435\u0433\u043E\u0434\u043D\u044F" })] }, dateStr));
        }) }));
};
//# sourceMappingURL=DatePicker.js.map