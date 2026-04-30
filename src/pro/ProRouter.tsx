import { Routes, Route, Navigate, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import DashboardPage from '@/pro/pages/DashboardPage/DashboardPage';
import BookingsBoardPage from '@/pro/pages/BookingsBoardPage/BookingsBoardPage';
import SchedulePage from '@/pro/pages/SchedulePage/SchedulePage';
import ServicesPage from '@/pro/pages/ServicesPage/ServicesPage';
import StaffPage from '@/pro/pages/StaffPage/StaffPage';
import ClientsPage from '@/pro/pages/ClientsPage/ClientsPage';
import MerchantSettingsPage from '@/pro/pages/MerchantSettingsPage/MerchantSettingsPage';
import MerchantPreviewPage from '@/pro/pages/MerchantPreviewPage/MerchantPreviewPage';
import MorePage from '@/pro/pages/MorePage/MorePage';
import BusinessSelectorPage from '@/pro/pages/BusinessSelectorPage/BusinessSelectorPage';
import GalleryPage from '@/pro/pages/GalleryPage/GalleryPage';
import { ProBottomNav } from '@/pro/components/ProBottomNav/ProBottomNav';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { listMyBusinesses, switchBusiness } from '@/pro/api';
import { useAuthStore } from '@/stores/authStore';
import { LoadingState } from '@/components/ui/LoadingState';

const TAB_PATHS = ['/pro', '/pro/bookings', '/pro/clients', '/pro/more', '/pro/schedule', '/pro/my-profile'];

function ProShell() {
  const location = useLocation();
  const isTabPage = TAB_PATHS.includes(location.pathname);
  return (
    <>
      <Outlet />
      <ProBottomNav visible={isTabPage} />
    </>
  );
}

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

/**
 * Smart Pro entry point.
 * - 0 businesses → /pro/settings (OnboardingChoice)
 * - 1 business   → auto-enter it, show dashboard
 * - 2+ businesses → /pro/select (BusinessSelectorPage)
 * If merchantId is already set (user was already in a session), go straight to dashboard.
 */
function ProIndex() {
  const navigate = useNavigate();
  const { merchantId, setMerchantId, setRole, setMasterId } = useMerchantStore();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const initStatus = useAuthStore(s => s.initStatus);
  const [checking, setChecking] = useState(!merchantId);

  useEffect(() => {
    if (initStatus === 'idle' || initStatus === 'loading') return;
    if (!isAuthenticated) {
      navigate('/auth?return=/pro', { replace: true });
      return;
    }
    if (merchantId) return; // already in a business, show dashboard
    setChecking(true);
    listMyBusinesses()
      .then(async (businesses) => {
        if (businesses.length === 0) {
          navigate('/pro/settings', { replace: true });
        } else if (businesses.length === 1) {
          // Auto-enter the only business
          const biz = businesses[0];
          try {
            const result = await switchBusiness(biz.id);
            localStorage.setItem('yookie_auth_token', result.token);
            useAuthStore.setState(s => ({
              user: s.user ? { ...s.user, businessId: result.businessId, role: result.role } : s.user,
              token: result.token,
            }));
            setMerchantId(result.businessId);
            setRole(result.role as 'owner' | 'staff');
            if (result.masterId) setMasterId(result.masterId);
            useMerchantStore.getState().setBusinessName(biz.name);
          } catch {
            setMerchantId(biz.id);
            setRole(biz.role as 'owner' | 'staff');
          }
          setChecking(false);
        } else {
          navigate('/pro/select', { replace: true });
        }
      })
      .catch(() => navigate('/pro/settings', { replace: true }));
  }, [initStatus, isAuthenticated]);

  if (initStatus === 'idle' || initStatus === 'loading') return <LoadingState variant="skeleton" />;
  if (!merchantId) return <LoadingState variant="skeleton" />;
  return <RequireOwner><DashboardPage /></RequireOwner>;
}

export function ProRouter() {
  return (
    <Routes>
      <Route element={<ProShell />}>
        <Route index element={<ProIndex />} />
        <Route path="select" element={<BusinessSelectorPage />} />
        <Route path="new-business" element={<MerchantSettingsPage forceNew />} />
        <Route path="bookings" element={<RequireMerchant><BookingsBoardPage /></RequireMerchant>} />
        <Route path="schedule" element={<RequireMerchant><SchedulePage /></RequireMerchant>} />
        <Route path="services" element={<RequireMerchant><ServicesPage /></RequireMerchant>} />
        <Route path="staff" element={<RequireOwner><StaffPage /></RequireOwner>} />
        <Route path="clients" element={<RequireOwner><ClientsPage /></RequireOwner>} />
        <Route path="settings" element={<MerchantSettingsPage />} />
        <Route path="more" element={<RequireOwner><MorePage /></RequireOwner>} />
        <Route path="my-profile" element={<RequireMerchant><MerchantPreviewPage /></RequireMerchant>} />
        <Route path="preview" element={<RequireMerchant><MerchantPreviewPage /></RequireMerchant>} />
        <Route path="gallery" element={<RequireOwner><GalleryPage /></RequireOwner>} />
        <Route path="*" element={<Navigate to="/pro" replace />} />
      </Route>
    </Routes>
  );
}
