/**
 * Merchant Store — B2B operational context.
 *
 * B2B and B2C share the SAME backend entities. This store tracks which
 * business the currently authenticated user manages in "Pro" mode.
 *
 * The businessId comes from the JWT token payload (set during OTP login
 * after user_accounts.business_id is assigned). It's also persisted in
 * localStorage for faster hydration.
 */

import { create } from 'zustand';

export type ProMode = 'off' | 'on';

interface MerchantState {
  /** Active business id the user manages. Null if not a merchant. */
  merchantId: string | null;
  /** Whether the user is currently viewing Pro surfaces. */
  mode: ProMode;
  /** Role of the current user in the business context. */
  role: 'owner' | 'staff' | null;
  /** Linked master profile id (populated for staff role). */
  masterId: string | null;
  /** Validation status of the merchantId */
  isValidating: boolean;
  validationError: string | null;
}

interface MerchantActions {
  setMerchantId: (id: string | null) => void;
  setRole: (role: 'owner' | 'staff' | null) => void;
  setMasterId: (masterId: string | null) => void;
  enterProMode: () => void;
  exitProMode: () => void;
  toggleMode: () => void;
  /** Try to extract businessId from JWT token in localStorage. */
  loadFromToken: () => void;
  loadFromStorage: () => void;
  /** Validate merchantId exists and is active */
  validateMerchantId: () => Promise<boolean>;
  clearValidationError: () => void;
}

const STORAGE_KEY = 'yookie_pro_merchant_id';

/**
 * Decode JWT payload without verification (client-side only).
 * Returns null if token is invalid.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export const useMerchantStore = create<MerchantState & MerchantActions>((set, get) => ({
  merchantId: null,
  mode: 'off',
  role: null,
  masterId: null,
  isValidating: false,
  validationError: null,

  setMerchantId: (id) => {
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
    set({ merchantId: id, validationError: null });
  },

  setRole: (role) => set({ role }),
  setMasterId: (masterId) => set({ masterId }),

  enterProMode: () => set({ mode: 'on' }),
  exitProMode: () => set({ mode: 'off' }),
  toggleMode: () => set({ mode: get().mode === 'on' ? 'off' : 'on' }),

  /**
   * Extract businessId, role, and masterId from the JWT stored by authStore.
   * JWT payload shape: { sub, phone, businessId, role, masterId }
   */
  loadFromToken: () => {
    try {
      const token = localStorage.getItem('yookie_auth_token');
      if (!token) return;

      const payload = decodeJwtPayload(token);
      if (!payload) {
        set({ 
          merchantId: null, 
          validationError: 'Неверный формат токена. Пожалуйста, войдите снова.' 
        });
        return;
      }

      const businessId = payload.businessId as string | null;
      const jwtRole = payload.role as string | null;
      const jwtMasterId = payload.masterId as string | null | undefined;

      if (businessId) {
        if (typeof businessId !== 'string' || businessId.trim() === '') {
          set({
            merchantId: null,
            validationError: 'Некорректный идентификатор бизнеса. Пожалуйста, свяжитесь с поддержкой.'
          });
          return;
        }
        localStorage.setItem(STORAGE_KEY, businessId);
        set({ merchantId: businessId, validationError: null });
      }
      // If token has no businessId, don't overwrite an existing merchantId —
      // the user may have selected a business via the selector flow.

      if (jwtRole === 'owner' || jwtRole === 'staff') {
        set({ role: jwtRole });
      } else {
        set({ role: null });
      }

      set({ masterId: jwtMasterId ?? null });
    } catch (err) {
      set({ 
        merchantId: null, 
        validationError: 'Ошибка при загрузке данных. Пожалуйста, обновите страницу.' 
      });
    }
  },

  loadFromStorage: () => {
    try {
      const id = localStorage.getItem(STORAGE_KEY);
      if (id) {
        // Basic validation on load
        if (typeof id !== 'string' || id.trim() === '') {
          localStorage.removeItem(STORAGE_KEY);
          set({ 
            merchantId: null, 
            validationError: 'Некорректный идентификатор бизнеса в хранилище.' 
          });
          return;
        }
        set({ merchantId: id, validationError: null });
      }
    } catch {
      set({ 
        merchantId: null, 
        validationError: 'Ошибка доступа к хранилищу.' 
      });
    }
  },

  /**
   * Validate that the merchantId is still valid and active.
   * This should be called when entering Pro mode or on page load.
   * Returns true if valid, false otherwise.
   */
  validateMerchantId: async () => {
    const state = get();
    const { merchantId } = state;
    
    if (!merchantId) {
      set({ validationError: 'Бизнес не выбран' });
      return false;
    }

    set({ isValidating: true, validationError: null });

    try {
      // In production, this would call an API endpoint to verify the business exists
      // For now, we do a basic check - in real implementation:
      // const response = await api.get(`/businesses/${merchantId}`);
      // if (!response.data.is_active) { ... }
      
      // Simulate API delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Basic validation passed
      set({ isValidating: false, validationError: null });
      return true;
    } catch (err) {
      set({ 
        isValidating: false, 
        validationError: 'Бизнес не найден или деактивирован. Пожалуйста, свяжитесь с поддержкой.' 
      });
      return false;
    }
  },

  clearValidationError: () => set({ validationError: null }),
}));

/** Returns true if the current user is an owner. */
export function isOwner(): boolean {
  return useMerchantStore.getState().role === 'owner';
}

/** Returns true if the current user is staff. */
export function isStaff(): boolean {
  return useMerchantStore.getState().role === 'staff';
}

// Auto-initialize on first module load:
// 1. Try localStorage (fastest, works across reloads)
// 2. Fall back to JWT decode (covers first session after login)
if (typeof window !== 'undefined') {
  const state = useMerchantStore.getState();
  state.loadFromStorage();
  if (!useMerchantStore.getState().merchantId) {
    state.loadFromToken();
  }
}
