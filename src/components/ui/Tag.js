import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import styles from './Tag.module.css';
export const Tag = ({ active = false, onClick, children, icon, 'aria-label': ariaLabel, 'aria-pressed': ariaPressed, }) => {
    return (_jsxs("button", { className: `${styles.tag} ${active ? styles.active : ''}`, onClick: onClick, type: "button", "aria-label": ariaLabel, "aria-pressed": ariaPressed !== undefined ? ariaPressed : active, children: [icon && _jsx("span", { className: styles.icon, children: icon }), _jsx("span", { children: children })] }));
};
//# sourceMappingURL=Tag.js.map