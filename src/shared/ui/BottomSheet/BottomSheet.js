import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef, useEffect } from 'react';
import styles from './BottomSheet.module.css';
export const BottomSheet = ({ open, onClose, title, children, 'aria-label': ariaLabel, }) => {
    const sheetRef = useRef(null);
    const startYRef = useRef(0);
    const startTransformRef = useRef(0);
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        }
        else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);
    const handleTouchStart = (e) => {
        const handle = e.currentTarget.closest(`.${styles.handle}`);
        if (!handle)
            return;
        startYRef.current = e.touches[0].clientY;
        startTransformRef.current = 0;
    };
    const handleTouchMove = (e) => {
        if (startYRef.current === 0)
            return;
        const currentY = e.touches[0].clientY;
        const diff = currentY - startYRef.current;
        if (diff > 0 && sheetRef.current) {
            startTransformRef.current = diff;
            sheetRef.current.style.transform = `translateY(${diff}px)`;
        }
    };
    const handleTouchEnd = () => {
        if (startTransformRef.current > 100 && sheetRef.current) {
            onClose();
        }
        else if (sheetRef.current) {
            sheetRef.current.style.transform = '';
        }
        startYRef.current = 0;
        startTransformRef.current = 0;
    };
    const handleBackdropClick = () => {
        onClose();
    };
    return (_jsxs(_Fragment, { children: [open && (_jsx("div", { className: styles.backdrop, onClick: handleBackdropClick, "aria-hidden": "true" })), _jsxs("div", { ref: sheetRef, className: `${styles.sheet} ${open ? styles.open : ''}`, role: "dialog", "aria-modal": "true", "aria-label": ariaLabel || title, onTouchStart: handleTouchStart, onTouchMove: handleTouchMove, onTouchEnd: handleTouchEnd, children: [_jsx("div", { className: styles.handle, children: _jsx("div", { className: styles.handleBar, "aria-hidden": "true" }) }), title && (_jsxs("div", { className: styles.header, children: [_jsx("h2", { className: styles.title, children: title }), _jsx("button", { className: styles.closeButton, onClick: onClose, "aria-label": "Close", type: "button", children: "\u2715" })] })), _jsx("div", { className: styles.content, children: children })] })] }));
};
//# sourceMappingURL=BottomSheet.js.map