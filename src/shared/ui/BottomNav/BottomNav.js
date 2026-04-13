import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from 'react-router-dom';
import styles from './BottomNav.module.css';
const defaultItems = [
    {
        path: '/',
        label: 'Home',
        icon: (_jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("path", { d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }), _jsx("polyline", { points: "9 22 9 12 15 12 15 22" })] })),
        ariaLabel: 'Home',
    },
    {
        path: '/search',
        label: 'Search',
        icon: (_jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("circle", { cx: "11", cy: "11", r: "8" }), _jsx("path", { d: "m21 21-4.35-4.35" })] })),
        ariaLabel: 'Search salons',
    },
    {
        path: '/my-bookings',
        label: 'Bookings',
        icon: (_jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("rect", { x: "3", y: "4", width: "18", height: "18", rx: "2", ry: "2" }), _jsx("line", { x1: "16", y1: "2", x2: "16", y2: "6" }), _jsx("line", { x1: "8", y1: "2", x2: "8", y2: "6" }), _jsx("line", { x1: "3", y1: "10", x2: "21", y2: "10" })] })),
        ariaLabel: 'My bookings',
    },
    {
        path: '/account',
        label: 'Account',
        icon: (_jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }), _jsx("circle", { cx: "12", cy: "7", r: "4" })] })),
        ariaLabel: 'Account',
    },
];
export const BottomNav = ({ items = defaultItems }) => {
    return (_jsx("nav", { className: styles.nav, role: "navigation", "aria-label": "Main navigation", children: items.map((item) => (_jsxs(NavLink, { to: item.path, className: ({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`, "aria-label": item.ariaLabel || item.label, children: [_jsx("span", { className: styles.icon, children: item.icon }), _jsx("span", { className: styles.label, children: item.label })] }, item.path))) }));
};
//# sourceMappingURL=BottomNav.js.map