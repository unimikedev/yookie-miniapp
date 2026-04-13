import { Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import SearchPage from '@/pages/SearchPage'
import NearbyPage from '@/pages/NearbyPage'
import BusinessDetailPage from '@/pages/BusinessDetailPage'
import MasterDetailPage from '@/pages/MasterDetailPage'
import BookingFlowPage from '@/pages/BookingFlowPage'
import MyBookingsPage from '@/pages/MyBookingsPage'
import FavoritesPage from '@/pages/FavoritesPage'
import AccountPage from '@/pages/AccountPage'
import AuthPage from '@/pages/AuthPage'
import NotFoundPage from '@/pages/NotFoundPage'
import ProfileEditPage from '@/pages/ProfileEditPage'
import ServiceMasterStep from '@/pages/ServiceMasterStep'

export function Router() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/nearby" element={<NearbyPage />} />
      <Route path="/business/:id" element={<BusinessDetailPage />} />
      <Route path="/business/:id/master/:masterId" element={<MasterDetailPage />} />
      <Route path="/business/:id/assign-masters" element={<ServiceMasterStep />} />
      <Route path="/booking" element={<BookingFlowPage />} />
      <Route path="/my-bookings" element={<MyBookingsPage />} />
      <Route path="/favorites" element={<FavoritesPage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/profile/edit" element={<ProfileEditPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
