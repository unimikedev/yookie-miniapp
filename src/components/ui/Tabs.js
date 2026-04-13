import { jsx as _jsx } from "react/jsx-runtime";
import React, { useRef, useEffect } from 'react';
import styles from './Tabs.module.css';
export const Tabs = ({ tabs, activeKey, onChange, 'aria-label': ariaLabel, }) => {
    const containerRef = useRef(null);
    const activeTabRef = useRef(null);
    useEffect(() => {
        if (activeTabRef.current && containerRef.current) {
            const container = containerRef.current;
            const activeTab = activeTabRef.current;
            const containerRect = container.getBoundingClientRect();
            const tabRect = activeTab.getBoundingClientRect();
            if (tabRect.left < containerRect.left) {
                container.scrollLeft -= containerRect.left - tabRect.left;
            }
            else if (tabRect.right > containerRect.right) {
                container.scrollLeft += tabRect.right - containerRect.right;
            }
        }
    }, [activeKey]);
    return (_jsx("div", { className: styles.tabsContainer, role: "tablist", "aria-label": ariaLabel, ref: containerRef, children: tabs.map((tab) => (_jsx("button", { ref: tab.key === activeKey ? activeTabRef : null, role: "tab", "aria-selected": tab.key === activeKey, "aria-controls": `panel-${tab.key}`, className: `${styles.tab} ${tab.key === activeKey ? styles.active : ''}`, onClick: () => onChange(tab.key), type: "button", children: tab.label }, tab.key))) }));
};
//# sourceMappingURL=Tabs.js.map