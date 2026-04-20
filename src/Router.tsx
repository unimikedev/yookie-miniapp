import { Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import SearchPage from '@/pages/SearchPage'
import NearbyPage from '@/pages/NearbyPage'
import ProviderDetailPage from '@/pages/ProviderDetailPage'
import BookingFlowPage from '@/pages/BookingFlowPage'
import MyBookingsPage from '@/pages/MyBookingsPage'
import FavoritesPage from '@/pages/FavoritesPage'
import AccountPage from '@/pages/AccountPage'
import AuthPage from '@/pages/AuthPage'
import NotFoundPage from '@/pages/NotFoundPage'
import ProfileEditPage from '@/pages/ProfileEditPage'
import InviteAcceptPage from '@/pages/InviteAcceptPage'
import { DeepLinkHandler } from '@/pages/DeepLinkHandler'
import { ProRouter } from '@/pro/ProRouter'

export function Router() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/nearby" element={<NearbyPage />} />
      {/* Unified provider detail — handles both business & individual providers */}
      <Route path="/business/:id" element={<ProviderDetailPage />} />
      <Route path="/booking" element={<BookingFlowPage />} />
      <Route path="/my-bookings" element={<MyBookingsPage />} />
      <Route path="/favorites" element={<FavoritesPage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/profile/edit" element={<ProfileEditPage />} />
      
      {/* Deep Links Handler */}
      <Route path="/link/:type/:id" element={<DeepLinkHandler />} />
      <Route path="/link/business/:businessId/service/:serviceId" element={<DeepLinkHandler />} />
      <Route path="/link/business/:businessId/master/:masterId" element={<DeepLinkHandler />} />
      
      {/* Invite accept page */}
      <Route path="/invite/:token" element={<InviteAcceptPage />} />

      {/* Yookie Pro (B2B) — self-contained sub-router */}
      <Route path="/pro/*" element={<ProRouter />} />
      
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
