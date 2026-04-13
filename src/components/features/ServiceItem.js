import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import styles from './ServiceItem.module.css';
const formatPrice = (price) => {
    return new Intl.NumberFormat('uz-UZ', {
        useGrouping: true,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
};
export const ServiceItem = ({ service, selected = false, onSelect, }) => {
    const handleClick = () => {
        if (onSelect) {
            onSelect(service);
        }
    };
    const price = formatPrice(service.price);
    const description = service.description
        ? service.description.length > 60
            ? service.description.substring(0, 60) + '...'
            : service.description
        : '';
    return (_jsxs("div", { className: `${styles.item} ${selected ? styles.selected : ''}`, onClick: handleClick, role: "button", tabIndex: 0, onKeyDown: (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
            }
        }, children: [_jsx("div", { className: styles.checkbox, children: _jsx("input", { type: "radio", name: "service-selector", checked: selected, onChange: () => { }, "aria-label": service.name }) }), _jsxs("div", { className: styles.content, children: [_jsx("h4", { className: styles.name, children: service.name }), description && _jsx("p", { className: styles.description, children: description })] }), _jsxs("div", { className: styles.details, children: [_jsxs("div", { className: styles.duration, children: [service.duration_min, " \u043C\u0438\u043D"] }), _jsxs("div", { className: styles.price, children: [price, " \u0441\u045E\u043C"] })] })] }));
};
//# sourceMappingURL=ServiceItem.js.map