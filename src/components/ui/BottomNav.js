import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './BottomNav.module.css';
const HomeIcon = ({ active }) => (_jsx("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V16H9V21H4C3.44772 21 3 20.5523 3 20V10.5Z", fill: active ? 'currentColor' : 'none', stroke: "currentColor", strokeWidth: "1.8", strokeLinejoin: "round" }) }));
const MapIcon = ({ active }) => (_jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", children: [_jsx("path", { d: "M12 2C8.68629 2 6 4.68629 6 8C6 12.5 12 19 12 19C12 19 18 12.5 18 8C18 4.68629 15.3137 2 12 2Z", fill: active ? 'currentColor' : 'none', stroke: "currentColor", strokeWidth: "1.8" }), _jsx("circle", { cx: "12", cy: "8", r: "2.5", fill: active ? 'var(--bg-surface)' : 'none', stroke: active ? 'var(--bg-surface)' : 'currentColor', strokeWidth: "1.8" })] }));
const CalendarIcon = ({ active }) => (_jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", children: [_jsx("rect", { x: "3", y: "5", width: "18", height: "16", rx: "2", fill: active ? 'currentColor' : 'none', stroke: "currentColor", strokeWidth: "1.8" }), _jsx("path", { d: "M3 10H21", stroke: active ? 'var(--bg-surface)' : 'currentColor', strokeWidth: "1.8" }), _jsx("path", { d: "M8 3V7", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" }), _jsx("path", { d: "M16 3V7", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" }), active && (_jsxs(_Fragment, { children: [_jsx("rect", { x: "7", y: "14", width: "3", height: "3", rx: "0.5", fill: "var(--bg-surface)" }), _jsx("rect", { x: "14", y: "14", width: "3", height: "3", rx: "0.5", fill: "var(--bg-surface)" })] }))] }));
const MenuIcon = ({ active }) => (_jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", children: [_jsx("circle", { cx: "5", cy: "12", r: "2", fill: "currentColor" }), _jsx("circle", { cx: "12", cy: "12", r: "2", fill: "currentColor" }), _jsx("circle", { cx: "19", cy: "12", r: "2", fill: "currentColor" }), active && (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "5", cy: "6", r: "1.2", fill: "currentColor", opacity: "0.5" }), _jsx("circle", { cx: "5", cy: "18", r: "1.2", fill: "currentColor", opacity: "0.5" })] }))] }));
const defaultItems = [
    {
        path: '/',
        label: 'Главная',
        icon: _jsx(HomeIcon, {}),
        activeIcon: _jsx(HomeIcon, { active: true }),
        ariaLabel: 'Главная страница',
        end: true,
    },
    {
        path: '/search',
        label: 'Рядом',
        icon: _jsx(MapIcon, {}),
        activeIcon: _jsx(MapIcon, { active: true }),
        ariaLabel: 'Рядом с вами',
    },
    {
        path: '/my-bookings',
        label: 'Мои записи',
        icon: _jsx(CalendarIcon, {}),
        activeIcon: _jsx(CalendarIcon, { active: true }),
        ariaLabel: 'Мои записи',
    },
    {
        path: '/menu',
        label: 'Меню',
        icon: _jsx(MenuIcon, {}),
        activeIcon: _jsx(MenuIcon, { active: true }),
        ariaLabel: 'Меню',
    },
];
export const BottomNav = ({ items = defaultItems }) => {
    return (_jsx("nav", { className: styles.nav, role: "navigation", "aria-label": "\u041E\u0441\u043D\u043E\u0432\u043D\u0430\u044F \u043D\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044F", children: items.map((item) => (_jsx(NavLink, { to: item.path, end: item.end, className: ({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`, "aria-label": item.ariaLabel || item.label, children: ({ isActive }) => (_jsxs(_Fragment, { children: [_jsx("span", { className: styles.icon, children: isActive && item.activeIcon ? item.activeIcon : item.icon }), _jsx("span", { className: styles.label, children: item.label })] })) }, item.path))) }));
};
//# sourceMappingURL=BottomNav.js.map