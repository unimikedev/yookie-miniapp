import { jsx as _jsx } from "react/jsx-runtime";
import { BrowserRouter } from 'react-router-dom';
import { PlatformContextProvider } from '@/hooks/usePlatform';
import Layout from '@/components/Layout';
import { Router } from '@/Router';
import '@/index.css';
export default function App() {
    return (_jsx(PlatformContextProvider, { children: _jsx(BrowserRouter, { children: _jsx(Layout, { children: _jsx(Router, {}) }) }) }));
}
//# sourceMappingURL=App.js.map