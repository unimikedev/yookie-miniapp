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
      
      {/* Yookie Pro (B2B) — self-contained sub-router */}
      <Route path="/pro/*" element={<ProRouter />} />
      
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
