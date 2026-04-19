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
import { useMerchantStore } from '@/pro/stores/merchantStore';

function RequireMerchant({ children }: { children: React.ReactNode }) {
  const { merchantId } = useMerchantStore();
  if (!merchantId) return <Navigate to="/pro/settings" replace />;
  return <>{children}</>;
}

export function ProRouter() {
  return (
    <Routes>
      <Route index element={<RequireMerchant><DashboardPage /></RequireMerchant>} />
      <Route path="bookings" element={<RequireMerchant><BookingsBoardPage /></RequireMerchant>} />
      <Route path="schedule" element={<RequireMerchant><SchedulePage /></RequireMerchant>} />
      <Route path="services" element={<RequireMerchant><ServicesPage /></RequireMerchant>} />
      <Route path="staff" element={<RequireMerchant><StaffPage /></RequireMerchant>} />
      <Route path="clients" element={<RequireMerchant><ClientsPage /></RequireMerchant>} />
      <Route path="settings" element={<MerchantSettingsPage />} />
      <Route path="preview" element={<RequireMerchant><MerchantPreviewPage /></RequireMerchant>} />
      <Route path="more" element={<RequireMerchant><MorePage /></RequireMerchant>} />
      <Route path="*" element={<Navigate to="/pro" replace />} />
    </Routes>
  );
}
