import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Badge, Button } from '@/components/ui';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import styles from './BookingCard.module.css';
const getStatusBadgeVariant = (status) => {
    switch (status) {
        case 'pending':
            return 'warning';
        case 'confirmed':
            return 'success';
        case 'completed':
            return 'info';
        case 'cancelled':
            return 'neutral';
        case 'no_show':
            return 'error';
        default:
            return 'neutral';
    }
};
const getStatusLabel = (status) => {
    const labels = {
        pending: 'Ожидание',
        confirmed: 'Подтверждено',
        completed: 'Завершено',
        cancelled: 'Отменено',
        no_show: 'Не явился',
    };
    return labels[status] || status;
};
const formatPrice = (price) => {
    return new Intl.NumberFormat('uz-UZ', {
        useGrouping: true,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
};
const formatDateTime = (dateString) => {
    try {
        const date = new Date(dateString);
        return format(date, 'dd MMMM, eee', { locale: ru });
    }
    catch {
        return dateString;
    }
};
const formatTime = (dateString) => {
    try {
        const date = new Date(dateString);
        return format(date, 'HH:mm');
    }
    catch {
        return dateString;
    }
};
export const BookingCard = ({ booking, onCancel, onReview, }) => {
    const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
    const canReview = booking.status === 'completed';
    const handleCancel = () => {
        if (onCancel) {
            onCancel(booking);
        }
    };
    const handleReview = () => {
        if (onReview) {
            onReview(booking);
        }
    };
    const date = formatDateTime(booking.starts_at);
    const time = formatTime(booking.starts_at);
    const price = formatPrice(booking.price);
    const statusLabel = getStatusLabel(booking.status);
    const statusVariant = getStatusBadgeVariant(booking.status);
    return (_jsxs("div", { className: styles.card, children: [_jsxs("div", { className: styles.header, children: [_jsxs("div", { className: styles.titles, children: [_jsx("h3", { className: styles.businessName, children: booking.businessName || 'Бизнес' }), _jsx("p", { className: styles.serviceName, children: booking.serviceName || 'Услуга' })] }), _jsx(Badge, { variant: statusVariant, children: statusLabel })] }), _jsxs("div", { className: styles.details, children: [_jsxs("div", { className: styles.detailRow, children: [_jsx("span", { className: styles.label, children: "\u041C\u0430\u0441\u0442\u0435\u0440:" }), _jsx("span", { className: styles.value, children: booking.masterName || 'Не указан' })] }), _jsxs("div", { className: styles.detailRow, children: [_jsx("span", { className: styles.label, children: "\u0414\u0430\u0442\u0430:" }), _jsx("span", { className: styles.value, children: date })] }), _jsxs("div", { className: styles.detailRow, children: [_jsx("span", { className: styles.label, children: "\u0412\u0440\u0435\u043C\u044F:" }), _jsx("span", { className: styles.value, children: time })] }), _jsxs("div", { className: styles.detailRow, children: [_jsx("span", { className: styles.label, children: "\u0426\u0435\u043D\u0430:" }), _jsxs("span", { className: `${styles.value} ${styles.price}`, children: [price, " \u0441\u045E\u043C"] })] })] }), (canCancel || canReview) && (_jsxs("div", { className: styles.actions, children: [canCancel && (_jsx(Button, { variant: "danger", size: "sm", fullWidth: true, onClick: handleCancel, "aria-label": "\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C \u0431\u0440\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435", children: "\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C" })), canReview && (_jsx(Button, { variant: "primary", size: "sm", fullWidth: true, onClick: handleReview, "aria-label": "\u041E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u043E\u0442\u0437\u044B\u0432", children: "\u041E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u043E\u0442\u0437\u044B\u0432" }))] }))] }));
};
//# sourceMappingURL=BookingCard.js.map