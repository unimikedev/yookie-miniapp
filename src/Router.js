import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import SearchPage from '@/pages/SearchPage';
import BusinessDetailPage from '@/pages/BusinessDetailPage';
import MasterDetailPage from '@/pages/MasterDetailPage';
import BookingFlowPage from '@/pages/BookingFlowPage';
import MyBookingsPage from '@/pages/MyBookingsPage';
import FavoritesPage from '@/pages/FavoritesPage';
import MenuPage from '@/pages/MenuPage';
import AuthPage from '@/pages/AuthPage';
export function Router() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/search", element: _jsx(SearchPage, {}) }), _jsx(Route, { path: "/business/:id", element: _jsx(BusinessDetailPage, {}) }), _jsx(Route, { path: "/business/:id/master/:masterId", element: _jsx(MasterDetailPage, {}) }), _jsx(Route, { path: "/booking", element: _jsx(BookingFlowPage, {}) }), _jsx(Route, { path: "/my-bookings", element: _jsx(MyBookingsPage, {}) }), _jsx(Route, { path: "/favorites", element: _jsx(FavoritesPage, {}) }), _jsx(Route, { path: "/menu", element: _jsx(MenuPage, {}) }), _jsx(Route, { path: "/auth", element: _jsx(AuthPage, {}) }), _jsx(Route, { path: "/account", element: _jsx(Navigate, { to: "/menu", replace: true }) })] }));
}
//# sourceMappingURL=Router.js.map