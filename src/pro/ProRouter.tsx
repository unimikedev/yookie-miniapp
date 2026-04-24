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

function RequireOwner({ children }: { children: React.ReactNode }) {
  const { merchantId, role } = useMerchantStore();
  if (!merchantId) return <Navigate to="/pro/settings" replace />;
  if (role === 'staff') return <Navigate to="/pro/bookings" replace />;
  return <>{children}</>;
}

export function ProRouter() {
  return (
    <Routes>
      <Route index element={<RequireOwner><DashboardPage /></RequireOwner>} />
      <Route path="bookings" element={<RequireMerchant><BookingsBoardPage /></RequireMerchant>} />
      <Route path="schedule" element={<RequireMerchant><SchedulePage /></RequireMerchant>} />
      <Route path="services" element={<RequireMerchant><ServicesPage /></RequireMerchant>} />
      <Route path="staff" element={<RequireOwner><StaffPage /></RequireOwner>} />
      <Route path="clients" element={<RequireOwner><ClientsPage /></RequireOwner>} />
      <Route path="settings" element={<MerchantSettingsPage />} />
      <Route path="preview" element={<RequireMerchant><MerchantPreviewPage /></RequireMerchant>} />
      <Route path="more" element={<RequireOwner><MorePage /></RequireOwner>} />
      <Route path="my-profile" element={<RequireMerchant><MerchantPreviewPage /></RequireMerchant>} />
      <Route path="*" element={<Navigate to="/pro" replace />} />
    </Routes>
  );
}
