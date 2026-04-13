import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import styles from './Badge.module.css';
export const Badge = ({ variant = 'neutral', children, className, }) => {
    return (_jsx("span", { className: `${styles.badge} ${styles[variant]} ${className || ''}`, role: "status", children: children }));
};
//# sourceMappingURL=Badge.js.map