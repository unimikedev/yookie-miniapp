import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import styles from './Rating.module.css';
export const Rating = ({ value, max = 5, size = 'md', readOnly = true, count, onChange, className, }) => {
    return (_jsxs("div", { className: [styles.root, styles[`size-${size}`], className ?? ''].filter(Boolean).join(' '), role: readOnly ? 'img' : 'group', "aria-label": `${value.toFixed(1)} из ${max}${count !== undefined ? `, ${count} отзывов` : ''}`, children: [_jsx("div", { className: styles.stars, children: Array.from({ length: max }, (_, i) => {
                    const filled = i < Math.round(value);
                    return (_jsx("button", { type: "button", className: [styles.star, filled ? styles.filled : styles.empty].join(' '), "aria-label": `${i + 1} звезда`, disabled: readOnly, onClick: () => !readOnly && onChange?.(i + 1), children: "\u2605" }, i));
                }) }), (value > 0 || count !== undefined) && (_jsxs("span", { className: styles.label, children: [value > 0 && _jsx("span", { className: styles.value, children: Number(value).toFixed(1) }), count !== undefined && count > 0 && (_jsxs("span", { className: styles.count, children: ["(", count, ")"] }))] }))] }));
};
//# sourceMappingURL=Rating.js.map