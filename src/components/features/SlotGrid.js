import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo } from 'react';
import styles from './SlotGrid.module.css';
const parseTime = (timeStr) => {
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
const getTimeOfDay = (date) => {
    const hour = date.getHours();
    if (hour < 12)
        return 'morning';
    if (hour < 17)
        return 'afternoon';
    return 'evening';
};
const formatTime = (timeStr) => {
    const date = parseTime(timeStr);
    if (!date)
        return timeStr;
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};
const isPastSlot = (slot) => {
    // Use ISO startsAt (slot.id) when available for accurate cross-date check.
    // Fallback to slot.start (HH:mm) — only reliable for today's slots.
    const checkStr = slot.id ?? slot.start;
    const date = parseTime(checkStr);
    if (!date)
        return false;
    return date.getTime() < Date.now();
};
export const SlotGrid = ({ slots, selectedSlot, onSelect }) => {
    const groupedSlots = useMemo(() => {
        const grouped = {
            morning: [],
            afternoon: [],
            evening: [],
        };
        slots.forEach((slot) => {
            if (!slot.is_available)
                return;
            const date = parseTime(slot.start);
            if (!date)
                return;
            const timeOfDay = getTimeOfDay(date);
            grouped[timeOfDay].push(slot);
        });
        // Sort each group
        Object.keys(grouped).forEach((key) => {
            grouped[key].sort((a, b) => {
                const dateA = parseTime(a.start);
                const dateB = parseTime(b.start);
                if (!dateA || !dateB)
                    return 0;
                return dateA.getTime() - dateB.getTime();
            });
        });
        return grouped;
    }, [slots]);
    const handleSlotClick = (slot) => {
        if (slot.is_available && !isPastSlot(slot)) {
            onSelect(slot);
        }
    };
    const renderSection = (title, sectionSlots) => {
        if (sectionSlots.length === 0)
            return null;
        return (_jsxs("div", { className: styles.section, children: [_jsx("h4", { className: styles.sectionTitle, children: title }), _jsx("div", { className: styles.grid, children: sectionSlots.map((slot) => {
                        const isSelected = selectedSlot === slot.id || selectedSlot === slot.start;
                        const isPast = isPastSlot(slot);
                        const time = formatTime(slot.start);
                        return (_jsx("button", { className: `${styles.slot} ${isSelected ? styles.selected : ''} ${isPast ? styles.disabled : ''}`, onClick: () => handleSlotClick(slot), disabled: isPast, "aria-label": `${time}${isPast ? ', unavailable' : ''}`, "aria-pressed": isSelected, children: time }, slot.id || slot.start));
                    }) })] }, title));
    };
    return (_jsxs("div", { className: styles.container, children: [renderSection('Утром', groupedSlots.morning), renderSection('Днем', groupedSlots.afternoon), renderSection('Вечером', groupedSlots.evening), slots.length === 0 && (_jsx("div", { className: styles.empty, children: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0445 \u0441\u043B\u043E\u0442\u043E\u0432" }))] }));
};
//# sourceMappingURL=SlotGrid.js.map