import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import styles from './EmptyState.module.css';
export const EmptyState = ({ icon = '📭', title, description, action, }) => {
    return (_jsxs("div", { className: styles.container, role: "status", "aria-label": title, children: [_jsx("div", { className: styles.icon, "aria-hidden": "true", children: icon }), _jsx("h2", { className: styles.title, children: title }), description && _jsx("p", { className: styles.description, children: description }), action && _jsx("div", { className: styles.action, children: action })] }));
};
//# sourceMappingURL=EmptyState.js.map