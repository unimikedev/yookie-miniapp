import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import styles from './Button.module.css';
export const Button = ({ variant = 'primary', size = 'md', fullWidth = false, loading = false, disabled = false, icon, children, onClick, type = 'button', className, 'aria-label': ariaLabel, }) => {
    return (_jsx("button", { type: type, className: `${styles.button} ${styles[variant]} ${styles[size]} ${fullWidth ? styles.fullWidth : ''} ${disabled ? styles.disabled : ''} ${loading ? styles.loading : ''} ${className || ''}`, onClick: onClick, disabled: disabled || loading, "aria-label": ariaLabel, "aria-busy": loading, children: loading ? (_jsx("span", { className: styles.spinner, "aria-hidden": "true" })) : (_jsxs(_Fragment, { children: [icon && _jsx("span", { className: styles.icon, children: icon }), _jsx("span", { children: children })] })) }));
};
//# sourceMappingURL=Button.js.map