# FRONTEND → BACKEND CONTRACT REPORT

**Generated:** Pre-release Audit  
**Scope:** Frontend API assumptions, contract mismatches, and integration risks

---

## FRONTEND REPORT

### Assumed API Contracts

#### Authentication Endpoints

| Endpoint | Method | Frontend Assumption | Expected Response |
|----------|--------|---------------------|-------------------|
| `/auth/otp/send` | POST | `{ phone: string, telegramId?: number }` | `{ success: true }` or void |
| `/auth/otp/verify` | POST | `{ phone: string, code: string }` | `{ token: string, user: { id, phone, name, businessId?, role? } }` |
| `/auth/google` | POST | `{ credential: string }` | `{ token: string, user: { id, email, name, phone?, businessId?, role?, avatarUrl? } }` |
| `/auth/register-merchant` | POST | `{ email, password, businessName, type, location? }` | `{ token: string, user: {...} }` |

#### Business Endpoints

| Endpoint | Method | Frontend Assumption | Expected Response |
|----------|--------|---------------------|-------------------|
| `GET /businesses` | GET | Query params: `city`, `category`, `lat`, `lng`, `radius`, `sort`, `page`, `limit` | `{ data: Business[], total: number }` (PaginatedResponse) |
| `GET /businesses/:id` | GET | — | `{ data: Business }` |
| `GET /businesses/:id/masters` | GET | — | `{ data: Master[] }` |
| `GET /businesses/:id/services` | GET | — | `{ data: Service[] }` |
| `GET /businesses/:id/slots` | GET | Query: `date`, `masterId`, `serviceId?`, `totalDuration?` | `{ data: [{ masterId, masterName, slots: [{ time, startsAt, endsAt, available }] }] }` |
| `GET /geo/route` | GET | Query: `fromLat`, `fromLng`, `toLat`, `toLng`, `mode` | `{ data: { distance_km, duration_min, polyline, source } }` |

#### Booking Endpoints

| Endpoint | Method | Frontend Assumption | Expected Response |
|----------|--------|---------------------|-------------------|
| `POST /bookings` | POST | `{ businessId, masterId, serviceId, startsAt, client: { phone, name }, notes? }` | `{ data: Booking }` |
| `GET /my` | GET | Query: `phone` | `{ data: Booking[] }` |
| `POST /bookings/:id/cancel` | POST | `{ phone: string }` | `{ success: true }` |
| `POST /bookings/:id/reschedule` | POST | `{ phone, startsAt, masterId? }` | `{ data: Booking }` |

#### Favorites Endpoints

| Endpoint | Method | Frontend Assumption | Expected Response |
|----------|--------|---------------------|-------------------|
| `GET /favorites` | GET | Query: `phone` | `{ data: [{ id: string }] }` |
| `POST /favorites/:id` | POST | — | `{ success: true }` |
| `DELETE /favorites/:id` | DELETE | Query: `phone` | `{ success: true }` |

#### Pro/Merchant Endpoints (B2B)

| Endpoint | Method | Frontend Assumption | Expected Response |
|----------|--------|---------------------|-------------------|
| `GET /merchants/:id/bookings` | GET | Query: `status?`, `date?` | `{ data: MerchantBooking[] }` |
| `GET /merchants/:id/clients` | GET | — | `{ data: MerchantClient[] }` |
| `GET /merchants/:id/services` | GET | — | `{ data: MerchantService[] }` |
| `GET /merchants/:id/staff` | GET | — | `{ data: MerchantStaff[] }` |
| `PATCH /merchants/:id` | PATCH | Merchant profile fields | `{ data: Merchant }` |
| `POST /businesses/upload-image` | POST | FormData with image | `{ url: string }` |

---

### Potential Mismatches

#### 1. **Response Wrapper Inconsistency**
- **Frontend expects:** All API responses wrapped in `{ data: ... }`
- **Risk:** Some endpoints may return unwrapped responses or different structures (`{ success: true }`, `{ token: ... }`)
- **Files affected:** `src/lib/api/businesses.ts`, `src/lib/api/bookings.ts`, `src/lib/api/auth.ts`
- **Evidence:** Code explicitly unwraps `response.data` in multiple places

#### 2. **JWT Token Storage Key**
- **Frontend uses:** `yookie_auth_token` (hardcoded in `client.ts`, `authStore.ts`)
- **Risk:** Backend may expect different header format or token location
- **Impact:** Authentication failures if backend expects cookie-based auth or different header name

#### 3. **Phone Number Format**
- **Frontend assumes:** Uzbekistan format `+998 XX XXX-XX-XX` (12 digits)
- **Risk:** Backend validation may differ; international users may break flows
- **Files affected:** `src/lib/utils/phone.ts`, all booking forms

#### 4. **Booking Conflict Detection**
- **Frontend checks:** `err.status === 409` OR message contains `'BOOKING_CONFLICT'` or `'SLOT_UNAVAILABLE'`
- **Risk:** Backend may use different status codes or error codes
- **File:** `src/pages/BookingFlowPage.tsx:153-156`

#### 5. **Favorites Sync Mechanism**
- **Frontend assumes:** Backend `/favorites` endpoint accepts `phone` query param for identification
- **Risk:** Backend may require JWT-only identification; phone-based lookup may be deprecated
- **File:** `src/stores/favoritesStore.ts:159`

#### 6. **Slot Response Transformation**
- **Frontend expects:** Backend returns `slots[{ time, startsAt, endsAt, available }]` per master
- **Risk:** Backend may return flat array or different field names (`is_available` vs `available`)
- **File:** `src/lib/api/bookings.ts:48-63`

#### 7. **Merchant ID Propagation**
- **Frontend assumes:** `user.businessId` from JWT is sufficient for merchant operations
- **Risk:** Backend may require separate merchant session or different identifier
- **File:** `src/stores/authStore.ts:82-84`

#### 8. **Image Upload Endpoint**
- **Frontend calls:** `POST /businesses/upload-image` directly
- **Risk:** This endpoint may not exist or may require different auth scope
- **File:** `src/pro/pages/MerchantSettingsPage/MerchantSettingsPage.tsx:665`

#### 9. **Geo-Route Fallback**
- **Frontend expects:** `/geo/route` returns `{ distance_km, duration_min, polyline, source }`
- **Risk:** Backend may not implement Yandex Maps integration; fallback logic unclear
- **File:** `src/lib/api/businesses.ts:71-84`

#### 10. **Telegram ID Handling**
- **Frontend sends:** `telegramId` as optional number in OTP request
- **Risk:** Backend may require bigint or string; Telegram bot integration may not exist
- **File:** `src/lib/api/auth.ts:21-24`

---

### Risks

#### Critical Risks (P0)

1. **No Environment Configuration**
   - `VITE_API_URL` not defined in any `.env` file
   - Falls back to `http://localhost:3000/api/v1` in production builds
   - **Impact:** Production deployment will fail to connect to backend

2. **Mock Data Fallback in Production Risk**
   - Multiple hooks fall back to mock data on API errors in DEV mode
   - Risk of accidentally shipping DEV build with mocks enabled
   - **Files:** `src/hooks/useBusiness.ts`, `src/lib/api/bookings.ts`

3. **Silent API Failures**
   - Favorites sync uses `.catch(() => {})` — failures are silently ignored
   - Users may think favorites are saved when they're not synced to backend
   - **File:** `src/stores/favoritesStore.ts:80, 83, 109, 130`

4. **Token Expiry Not Handled**
   - No logic for token refresh or 401 handling
   - Users will be stuck in broken state when JWT expires
   - **File:** `src/lib/api/client.ts`

#### High Risks (P1)

5. **Inconsistent Error Handling**
   - Some endpoints throw `ApiError`, others return raw errors
   - Error mapping in `errorMapper.ts` may not cover all cases
   - User-facing error messages may be generic or misleading

6. **Race Conditions in Store Initialization**
   - Auto-initialization pattern in stores (`initialized` flag) is not thread-safe
   - Multiple store accesses before initialization completes may cause inconsistent state
   - **Files:** `src/stores/authStore.ts:214-218`, `src/stores/favoritesStore.ts:189-196`

7. **Multi-Service Booking Atomicity**
   - `Promise.allSettled` allows partial failures
   - User may see "success" with only some services booked
   - No rollback mechanism for failed services
   - **File:** `src/pages/BookingFlowPage.tsx:116-142`

8. **localStorage Dependency**
   - Heavy reliance on localStorage for auth, favorites, bookings
   - Will fail in incognito mode or if storage is quota-exceeded
   - No graceful degradation strategy

#### Medium Risks (P2)

9. **Type Safety Gaps**
   - Extensive use of `any` casting (40+ instances)
   - Silent type coercion may hide runtime errors
   - **Examples:** `(window as any).Telegram`, `(booking as any).client_name`

10. **Hardcoded Values**
    - Color codes in SVG icons (`#6BCEFF`, `#6B7280`, etc.)
    - Phone format hardcoded to Uzbekistan
    - API base URL fallback hardcoded

11. **Debug Logging in Production Risk**
    - `console.log` statements not stripped from production
    - May expose sensitive data or degrade performance
    - **Files:** `src/lib/api/businesses.ts:102-104`, multiple hooks

12. **Unused UI Components**
    - 7 stub components in `src/shared/ui/` marked as TODO
    - Dead code increases bundle size and maintenance burden
    - **Files:** `Surface.tsx`, `TextField.tsx`, `Spinner.tsx`, `LinkButton.tsx`, `Separator.tsx`, `Chip.tsx`, `Checkbox.tsx`, `Alert.tsx`

---

### Required Backend Changes

#### Must-Have Before MVP

1. **Environment Variable Documentation**
   - Provide production API URL
   - Document required `VITE_API_URL` in deployment checklist

2. **Standardize Response Format**
   - Confirm all endpoints return `{ data: T }` wrapper
   - Or update frontend to handle mixed response formats
   - **Priority:** CRITICAL

3. **Implement Token Refresh Flow**
   - Add `/auth/refresh` endpoint or implement short-lived tokens with refresh rotation
   - Frontend needs clear 401 handling strategy

4. **Error Code Standardization**
   - Define standard error codes: `BOOKING_CONFLICT`, `SLOT_UNAVAILABLE`, `INVALID_PHONE`, etc.
   - Ensure consistent HTTP status codes (409 for conflicts, 400 for validation)

5. **Favorites Endpoint Verification**
   - Confirm `/favorites` endpoints exist and accept phone-based identification
   - Or migrate to JWT-only identification

6. **Image Upload Endpoint**
   - Implement `POST /businesses/upload-image` or provide alternative (S3 presigned URLs)
   - Document expected FormData structure

#### Should-Have for Stability

7. **Slot Availability Real-Time Updates**
   - Consider WebSocket or polling endpoint for slot availability
   - Reduce booking conflicts from race conditions

8. **Geo-Route Fallback Implementation**
   - If Yandex Maps integration is not ready, provide simple distance estimation endpoint
   - Or remove feature from MVP

9. **Telegram Bot Integration**
   - Confirm OTP via Telegram bot is implemented
   - Or remove `telegramId` parameter from auth flow

10. **Batch Booking Endpoint**
    - Add `POST /bookings/batch` for multi-service bookings
    - Ensure atomicity (all-or-nothing) for multi-service reservations

#### Nice-to-Have for Scale

11. **Pagination Standardization**
    - Confirm all list endpoints support `page`, `limit`, `total` response fields
    - Document max page size limits

12. **Rate Limiting Headers**
    - Return rate limit info in response headers
    - Frontend can implement backoff strategies

13. **Feature Flags Endpoint**
    - Allow backend to control feature rollout (e.g., multi-service booking)
    - Reduce need for frontend deploys for feature toggles

---

## Summary of Systemic Weaknesses

### Architecture Patterns

1. **Tight Coupling to Backend Structure**
   - Frontend makes strong assumptions about response shapes
   - No adapter layer to insulate from backend changes

2. **Mixed Mock/Real Data Strategy**
   - DEV mode seamlessly falls back to mocks
   - Risk of developing against mocks that diverge from real API

3. **State Management Fragmentation**
   - Multiple Zustand stores with cross-store dependencies
   - `authStore` → `merchantStore` coupling creates initialization order issues

4. **Error Handling Inconsistency**
   - Some errors mapped to user-friendly messages, others bubble up raw
   - No centralized error tracking or reporting

### Design System Issues

1. **Incomplete Component Library**
   - 8 stub components block UI consistency
   - Inline SVGs with hardcoded colors violate design token system

2. **CSS Module Proliferation**
   - 77 module CSS files with potential duplication
   - No clear pattern for shared styles or layout utilities

### Performance Concerns

1. **Unoptimized Re-renders**
   - Limited use of `useMemo`/`useCallback`
   - Large lists (businesses, masters) may re-render unnecessarily

2. **Parallel Data Fetching Without Deduplication**
   - Same business data may be fetched multiple times across components
   - No request caching or deduplication layer

---

**Recommendation:** Address P0 items before any production deployment. P1 items should be resolved within first 2 weeks post-MVP. Create backend-frontend sync meeting to align on contracts before finalizing API implementations.
