import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SearchField — shared/ui wrapper
 * HeroUI ref: heroui-native-main/src/components/search-field
 * Flat API: value, onChange, onClear, placeholder, autoFocus
 */
import { useRef, useEffect } from 'react';
import styles from './SearchField.module.css';
export const SearchField = ({ value, onChange, onClear, placeholder = 'Поиск...', autoFocus = false, className, 'aria-label': ariaLabel, }) => {
    const inputRef = useRef(null);
    useEffect(() => {
        if (autoFocus)
            inputRef.current?.focus();
    }, [autoFocus]);
    const handleClear = () => {
        onChange('');
        onClear?.();
        inputRef.current?.focus();
    };
    return (_jsxs("div", { className: [styles.root, className ?? ''].filter(Boolean).join(' '), children: [_jsx("span", { className: styles.icon, "aria-hidden": "true", children: "\uD83D\uDD0D" }), _jsx("input", { ref: inputRef, type: "text", className: styles.input, value: value, onChange: (e) => onChange(e.target.value), placeholder: placeholder, "aria-label": ariaLabel ?? placeholder, autoComplete: "off", spellCheck: false }), value && (_jsx("button", { type: "button", className: styles.clearButton, onClick: handleClear, "aria-label": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C", children: "\u2715" }))] }));
};
//# sourceMappingURL=SearchField.js.map