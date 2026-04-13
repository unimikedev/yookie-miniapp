import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import styles from './Avatar.module.css';
const getInitials = (name) => {
    return name
        .split(' ')
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join('');
};
export const Avatar = ({ src, name = 'User', size = 'md', alt, 'aria-label': ariaLabel, }) => {
    const initials = getInitials(name);
    const finalAlt = alt || name;
    const finalAriaLabel = ariaLabel || `Avatar for ${name}`;
    return (_jsx("div", { className: `${styles.avatar} ${styles[size]}`, "aria-label": finalAriaLabel, children: src ? (_jsx("img", { src: src, alt: finalAlt, className: styles.image })) : (_jsx("div", { className: styles.initials, children: initials })) }));
};
//# sourceMappingURL=Avatar.js.map