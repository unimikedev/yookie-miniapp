# Frontend Implementation Plan - Pre-MVP QA Fixes

## Overview
This document tracks frontend implementation progress for addressing critical Pre-MVP QA issues identified in the audit. Backend requirements are documented separately in `BACKEND_REQUIREMENTS.prompt`.

---

## Phase 1: Critical Fixes (Must Complete First)

### 1.1 B2C → B2B Booking Synchronization
**Status:** ⏳ Pending Backend Implementation

**Frontend Changes Required:**
- [ ] Update `merchantStore.ts` to subscribe to WebSocket/SSE notifications
- [ ] Add real-time booking updates in Pro dashboard
- [ ] Implement optimistic UI updates with rollback on failure
- [ ] Add notification badge for new bookings

**Files to Modify:**
- `src/stores/merchantStore.ts` - Add WebSocket subscription
- `src/pages/pro/DashboardPage.tsx` - Display real-time updates
- `src/components/NotificationBadge.tsx` - New component

**Backend Dependency:** 
- WebSocket endpoint `/api/merchants/:merchantId/notifications`
- Booking creation webhook

---

### 1.2 Merchant Profile Validation Before B2C Listing
**Status:** ⏳ Pending Backend Implementation

**Frontend Changes Required:**
- [ ] Add profile completeness check in `MerchantSettingsPage`
- [ ] Show warning banner if profile incomplete
- [ ] Prevent "Go Live" until minimum requirements met
- [ ] Add progress indicator for onboarding steps

**Files to Modify:**
- `src/pages/pro/MerchantSettingsPage/MerchantSettingsPage.tsx`
- `src/components/MerchantProfileProgress.tsx` - New component
- `src/lib/api/merchants.ts` - Add `getProfileStatus` call

**Backend Dependency:**
- `GET /api/merchants/:merchantId/profile-status`
- Filtering of incomplete profiles in business listings

---

### 1.3 Enhanced Slot Conflict Handling
**Status:** ⏳ Pending Backend Implementation

**Frontend Changes Required:**
- [ ] Update `BookingFlowPage.tsx` to handle 409 with alternatives
- [ ] Show suggested alternative times in error modal
- [ ] Allow one-click retry with alternative slot
- [ ] Add countdown timer showing how long slot is held

**Files to Modify:**
- `src/pages/BookingFlowPage.tsx` - Handle conflict response
- `src/components/SlotConflictModal.tsx` - New component
- `src/lib/api/bookings.ts` - Parse alternative slots

**Backend Dependency:**
- Enhanced 409 response with `suggested_alternatives`

---

### 1.4 JWT Merchant ID Propagation Fix
**Status:** ⏳ Pending Backend Implementation

**Frontend Changes Required:**
- [ ] Update `authStore.ts` to extract `merchant_id` and `business_ids` from JWT
- [ ] Add explicit merchant context fetch after login
- [ ] Fix ProRouter initialization to wait for merchant data
- [ ] Add loading state during merchant context load

**Files to Modify:**
- `src/stores/authStore.ts` - Parse new JWT fields
- `src/routers/ProRouter.tsx` - Add context loading
- `src/lib/api/auth.ts` - Add `getMerchantContext` call

**Backend Dependency:**
- JWT token with `merchant_id` and `business_ids` fields
- `GET /api/merchants/me` endpoint

---

## Phase 2: High Priority Improvements

### 2.1 Merchant Onboarding Wizard
**Status:** ✅ Partially Implemented (needs enhancement)

**Current State:**
- Wizard exists in `MerchantSettingsPage` (steps 1-3)
- No post-creation guidance

**Required Enhancements:**
- [ ] Add interactive checklist after business creation
- [ ] Show tooltips for each required step
- [ ] Add "Preview Profile" button
- [ ] Send push notification when profile goes live

**Files to Modify:**
- `src/pages/pro/MerchantSettingsPage/MerchantSettingsPage.tsx`
- `src/components/OnboardingChecklist.tsx` - New component

---

### 2.2 Pagination for Business Lists
**Status:** ⏳ Pending Backend Implementation

**Frontend Changes Required:**
- [ ] Update `useHomeData`, `useBusinesses` hooks to support pagination
- [ ] Implement infinite scroll with intersection observer
- [ ] Add loading skeleton for appended items
- [ ] Handle empty states properly

**Files to Modify:**
- `src/hooks/useHomeData.ts`
- `src/hooks/useBusinesses.ts`
- `src/pages/HomePage.tsx`
- `src/components/BusinessList.tsx` - New component

**Backend Dependency:**
- Paginated responses with `limit`, `offset`, `has_more`

---

### 2.3 Search & Filter Enhancements
**Status:** ❌ Not Started

**Required Features:**
- [ ] Add price range slider in `SearchPage`
- [ ] Add rating filter (stars)
- [ ] Add distance filter (km)
- [ ] Save filter preferences to localStorage
- [ ] Add "Clear All Filters" button

**Files to Modify:**
- `src/pages/SearchPage.tsx`
- `src/components/FilterPanel.tsx` - New component
- `src/components/PriceRangeSlider.tsx` - New component

---

### 2.4 Client Search in B2B
**Status:** ❌ Not Started

**Required Features:**
- [ ] Add search input in `ClientsPage`
- [ ] Search by name, phone, service history
- [ ] Debounced search with 300ms delay
- [ ] Highlight matching text in results

**Files to Modify:**
- `src/pages/pro/ClientsPage.tsx`
- `src/components/SearchInput.tsx` - Reuse existing or create new

---

### 2.5 Telegram Notifications Integration
**Status:** ⏳ Pending Backend Implementation

**Frontend Changes Required:**
- [ ] Add Telegram notification preferences in settings
- [ ] Show notification permission prompt
- [ ] Display notification history in app
- [ ] Add deep links from notifications to specific bookings

**Files to Modify:**
- `src/pages/AccountPage.tsx`
- `src/pages/pro/SettingsPage.tsx`
- `src/components/NotificationPreferences.tsx` - New component

**Backend Dependency:**
- Telegram bot integration
- Notification storage and retrieval API

---

### 2.6 Schedule Validation UI
**Status:** ❌ Not Started

**Required Features:**
- [ ] Real-time validation in schedule editor
- [ ] Show error if close < open
- [ ] Warn if operating hours < longest service
- [ ] Require at least 1 day open
- [ ] Visual indicator for invalid days

**Files to Modify:**
- `src/pages/pro/SchedulePage.tsx`
- `src/components/ScheduleValidator.tsx` - New component

---

### 2.7 Image Optimization on Upload
**Status:** ❌ Not Started

**Required Features:**
- [ ] Client-side image resize before upload (max 1920px)
- [ ] JPEG compression (80% quality)
- [ ] Progress bar during upload
- [ ] Show file size reduction
- [ ] Generate preview thumbnails

**Files to Modify:**
- `src/lib/utils/imageOptimizer.ts` - New utility
- `src/components/ImageUploader.tsx` - Enhance existing
- `src/pages/pro/MerchantSettingsPage/MerchantSettingsPage.tsx`

---

### 2.8 Offline Mode Support
**Status:** ❌ Not Started

**Required Features:**
- [ ] Detect online/offline status
- [ ] Queue actions when offline
- [ ] Sync queue when back online
- [ ] Show offline indicator in UI
- [ ] Cache critical data (services, schedule)

**Files to Modify:**
- `src/lib/api/client.ts` - Add offline queue
- `src/hooks/useOnlineStatus.ts` - New hook
- `src/components/OfflineBanner.tsx` - New component

---

## Phase 3: Medium Priority Polish

### 3.1 Unified Loading States
**Status:** ⏳ In Progress (skeletons added, needs unification)

**Required Actions:**
- [ ] Create `<LoadingState>` component with variants
- [ ] Replace all spinners with consistent skeletons
- [ ] Add shimmer animation
- [ ] Standardize empty states

**Files to Modify:**
- `src/components/LoadingState.tsx` - New component
- All pages using inconsistent loading indicators

---

### 3.2 Booking Flow Optimization for Solo Masters
**Status:** ❌ Not Started

**Required Features:**
- [ ] Detect if business has only 1 master
- [ ] Auto-select that master, skip selection step
- [ ] Show "Your personal master" badge
- [ ] Reduce steps from 4 to 3

**Files to Modify:**
- `src/pages/ProviderDetailPage.tsx`
- `src/pages/BookingFlowPage.tsx`

---

### 3.3 Recent Views History
**Status:** ❌ Not Started

**Required Features:**
- [ ] Track viewed business profiles in localStorage
- [ ] Show "Recently Viewed" section on HomePage
- [ ] Limit to last 10 views
- [ ] Add clear history option

**Files to Modify:**
- `src/pages/HomePage.tsx`
- `src/lib/utils/recentViews.ts` - New utility
- `src/components/RecentViewsCarousel.tsx` - New component

---

### 3.4 Merchant Preview Mode
**Status:** ❌ Not Started

**Required Features:**
- [ ] Add "Preview as Customer" button in Pro settings
- [ ] Open modal/window with public profile view
- [ ] Hide edit buttons in preview mode
- [ ] Show what customers see vs what merchant sees

**Files to Modify:**
- `src/pages/pro/MerchantSettingsPage/MerchantSettingsPage.tsx`
- `src/components/MerchantPreviewModal.tsx` - New component

---

### 3.5 Error Message Improvements
**Status:** ❌ Not Started

**Required Actions:**
- [ ] Create error message mapping utility
- [ ] Map error codes to user-friendly messages
- [ ] Add suggested actions for each error
- [ ] Localize all error messages

**Files to Modify:**
- `src/lib/utils/errorMessages.ts` - New utility
- All API call sites

---

### 3.6 Role-Based Access Control UI
**Status:** ❌ Not Started

**Required Features:**
- [ ] Add role selector when adding staff (owner/admin/master)
- [ ] Hide admin features from master role
- [ ] Show role badges in staff list
- [ ] Restrict settings access by role

**Files to Modify:**
- `src/pages/pro/StaffPage.tsx`
- `src/stores/merchantStore.ts` - Add role field
- `src/components/RoleBadge.tsx` - New component

---

### 3.7 Data Export Feature
**Status:** ❌ Not Started

**Required Features:**
- [ ] Add "Export CSV" button in ClientsPage
- [ ] Add "Export CSV" button in BookingsBoardPage
- [ ] Include date range selector
- [ ] Generate CSV client-side or request from backend

**Files to Modify:**
- `src/pages/pro/ClientsPage.tsx`
- `src/pages/pro/BookingsBoardPage.tsx`
- `src/lib/utils/csvExporter.ts` - New utility

---

### 3.8 Dark Theme for Pro
**Status:** ❌ Not Started

**Required Actions:**
- [ ] Ensure all Pro components use themeStore
- [ ] Test all Pro pages in dark mode
- [ ] Fix any hardcoded colors
- [ ] Add theme toggle in Pro settings

**Files to Modify:**
- All Pro pages and components
- `src/styles/pro-theme.css` - May need additions

---

### 3.9 Tablet Responsive Layout
**Status:** ❌ Not Started

**Required Features:**
- [ ] Add media queries for tablet (768px+)
- [ ] Use grid layout for dashboard on tablets
- [ ] Expand navbar to sidebar on large screens
- [ ] Optimize touch targets for tablet

**Files to Modify:**
- `src/layouts/ProLayout.tsx`
- All page stylesheets

---

### 3.10 Deep Links for Services/Masters
**Status:** ❌ Not Started

**Required Features:**
- [ ] Add routes `/business/:id/service/:serviceId`
- [ ] Add routes `/master/:masterId`
- [ ] Generate shareable links
- [ ] Handle direct navigation to deep links

**Files to Modify:**
- `src/routers/AppRouter.tsx`
- `src/pages/ServiceDetailPage.tsx` - New page
- `src/pages/MasterPublicPage.tsx` - New page

---

### 3.11 Data Caching Strategy
**Status:** ❌ Not Started

**Required Actions:**
- [ ] Integrate React Query or SWR
- [ ] Cache categories, cities, static data
- [ ] Implement stale-while-revalidate
- [ ] Add cache invalidation on mutations

**Files to Modify:**
- `src/lib/api/client.ts`
- All data-fetching hooks

---

## Implementation Status Summary

| Category | Total Items | Completed | In Progress | Not Started | Blocked by Backend |
|----------|-------------|-----------|-------------|-------------|-------------------|
| Critical | 4 | 0 | 0 | 0 | 4 |
| High | 8 | 1 | 0 | 3 | 4 |
| Medium | 11 | 0 | 1 | 10 | 0 |
| **Total** | **23** | **1** | **1** | **13** | **8** |

---

## Next Steps

### Immediate (This Iteration)
1. ✅ Created `BACKEND_REQUIREMENTS.prompt` for backend agent
2. ⏳ Wait for backend to implement Phase 1 APIs
3. ⏳ Prepare frontend components for integration

### Short Term (Next 1-2 Weeks)
1. Implement offline-first architecture
2. Add image optimization utilities
3. Create unified loading state component
4. Build enhanced error handling

### Medium Term (Before MVP Launch)
1. Integrate WebSocket for real-time updates
2. Complete pagination across all lists
3. Finish onboarding wizard enhancements
4. Test end-to-end booking flow with backend

---

## Notes for Development Team

- All backend-dependent features are blocked until APIs are ready
- Focus on Phase 3 items that don't require backend changes while waiting
- Coordinate with backend team on API contract finalization
- Test all changes on both iOS and Android Telegram clients
- Ensure all new components are accessible (a11y)

---

**Last Updated:** 2025-01-14
**Next Review:** After backend Phase 1 completion
