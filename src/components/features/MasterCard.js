import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Avatar, Rating, Badge } from '@/components/ui';
import styles from './MasterCard.module.css';
export const MasterCard = ({ master, onClick }) => {
    const handleClick = () => {
        if (onClick) {
            onClick(master);
        }
    };
    const statusBadge = master.is_active ? (_jsx(Badge, { variant: "success", children: "\u0410\u043A\u0442\u0438\u0432\u0435\u043D" })) : (_jsx(Badge, { variant: "error", children: "\u041D\u0435\u0430\u043A\u0442\u0438\u0432\u0435\u043D" }));
    return (_jsxs("div", { className: styles.card, onClick: handleClick, children: [_jsx("div", { className: styles.avatar, children: _jsx(Avatar, { src: master.photo_url, name: master.name, size: "lg" }) }), _jsxs("div", { className: styles.content, children: [_jsx("h3", { className: styles.name, children: master.name }), _jsx("p", { className: styles.specialization, children: master.specialization }), _jsx("div", { className: styles.rating, children: _jsx(Rating, { value: master.rating, count: master.review_count, size: "sm" }) }), _jsx("div", { className: styles.status, children: statusBadge })] })] }));
};
//# sourceMappingURL=MasterCard.js.map