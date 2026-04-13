import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import styles from './Rating.module.css';
export const Rating = ({ value, count, size = 'md', 'aria-label': ariaLabel, }) => {
    const ratingValue = Math.max(0, Math.min(5, value));
    const ratingLabel = ariaLabel || `Rating: ${ratingValue.toFixed(1)} out of 5${count ? ` from ${count} reviews` : ''}`;
    return (_jsxs("div", { className: `${styles.rating} ${styles[size]}`, "aria-label": ratingLabel, children: [_jsx("span", { className: styles.star, "aria-hidden": "true", children: "\u2605" }), _jsx("span", { className: styles.value, children: ratingValue.toFixed(1) }), count !== undefined && _jsxs("span", { className: styles.count, children: ["(", count, ")"] })] }));
};
//# sourceMappingURL=Rating.js.map