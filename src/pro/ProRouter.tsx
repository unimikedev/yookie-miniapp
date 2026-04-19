import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from '@/pro/pages/DashboardPage/DashboardPage';
import BookingsBoardPage from '@/pro/pages/BookingsBoardPage/BookingsBoardPage';
import SchedulePage from '@/pro/pages/SchedulePage/SchedulePage';
import ServicesPage from '@/pro/pages/ServicesPage/ServicesPage';
import StaffPage from '@/pro/pages/StaffPage/StaffPage';
import ClientsPage from '@/pro/pages/ClientsPage/ClientsPage';
import MerchantSettingsPage from '@/pro/pages/MerchantSettingsPage/MerchantSettingsPage';
import MerchantPreviewPage from '@/pro/pages/MerchantPreviewPage/MerchantPreviewPage';
import MorePage from '@/pro/pages/MorePage/MorePage';

export function ProRouter() {
  return (
    <Routes>
      <Route index element={<DashboardPage />} />
      <Route path="bookings" element={<BookingsBoardPage />} />
      <Route path="schedule" element={<SchedulePage />} />
      <Route path="services" element={<ServicesPage />} />
      <Route path="staff" element={<StaffPage />} />
      <Route path="clients" element={<ClientsPage />} />
      <Route path="settings" element={<MerchantSettingsPage />} />
      <Route path="preview" element={<MerchantPreviewPage />} />
      <Route path="more" element={<MorePage />} />
      <Route path="*" element={<Navigate to="/pro" replace />} />
    </Routes>
  );
}
