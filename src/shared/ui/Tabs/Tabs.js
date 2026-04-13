import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Tabs — shared/ui wrapper
 * HeroUI ref: heroui-native-main/src/components/tabs
 * Flat API: tabs[], activeKey, onChange
 */
import { useRef, useEffect } from 'react';
import styles from './Tabs.module.css';
export const Tabs = ({ tabs, activeKey, onChange, variant = 'primary', className, 'aria-label': ariaLabel, }) => {
    const containerRef = useRef(null);
    const activeRef = useRef(null);
    useEffect(() => {
        if (activeRef.current && containerRef.current) {
            const container = containerRef.current;
            const tab = activeRef.current;
            const cRect = container.getBoundingClientRect();
            const tRect = tab.getBoundingClientRect();
            if (tRect.left < cRect.left)
                container.scrollLeft -= cRect.left - tRect.left;
            else if (tRect.right > cRect.right)
                container.scrollLeft += tRect.right - cRect.right;
        }
    }, [activeKey]);
    return (_jsx("div", { ref: containerRef, className: [styles.root, styles[`variant-${variant}`], className ?? ''].filter(Boolean).join(' '), role: "tablist", "aria-label": ariaLabel, children: tabs.map((tab) => {
            const isActive = tab.key === activeKey;
            return (_jsx("button", { ref: isActive ? activeRef : null, role: "tab", type: "button", "aria-selected": isActive, "aria-controls": `panel-${tab.key}`, className: [styles.tab, isActive ? styles.active : ''].filter(Boolean).join(' '), onClick: () => onChange(tab.key), children: tab.label }, tab.key));
        }) }));
};
//# sourceMappingURL=Tabs.js.map