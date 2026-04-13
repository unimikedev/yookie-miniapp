import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useRef, useEffect } from 'react';
import styles from './SearchInput.module.css';
export const SearchInput = ({ value, onChange, onClear, placeholder = 'Search...', autoFocus = false, 'aria-label': ariaLabel, }) => {
    const inputRef = useRef(null);
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);
    const handleClear = () => {
        onChange('');
        onClear?.();
        inputRef.current?.focus();
    };
    return (_jsxs("div", { className: styles.container, children: [_jsx("span", { className: styles.icon, "aria-hidden": "true", children: "\uD83D\uDD0D" }), _jsx("input", { ref: inputRef, type: "text", className: styles.input, value: value, onChange: (e) => onChange(e.target.value), placeholder: placeholder, "aria-label": ariaLabel || placeholder, autoComplete: "off" }), value && (_jsx("button", { className: styles.clearButton, onClick: handleClear, "aria-label": "Clear search", type: "button", children: "\u2715" }))] }));
};
//# sourceMappingURL=SearchInput.js.map