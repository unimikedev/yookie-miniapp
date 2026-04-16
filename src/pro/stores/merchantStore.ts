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
}

interface MerchantActions {
  setMerchantId: (id: string | null) => void;
  enterProMode: () => void;
  exitProMode: () => void;
  toggleMode: () => void;
  /** Try to extract businessId from JWT token in localStorage. */
  loadFromToken: () => void;
  loadFromStorage: () => void;
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

  setMerchantId: (id) => {
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
    set({ merchantId: id });
  },

  enterProMode: () => set({ mode: 'on' }),
  exitProMode: () => set({ mode: 'off' }),
  toggleMode: () => set({ mode: get().mode === 'on' ? 'off' : 'on' }),

  /**
   * Extract businessId from the JWT stored by authStore.
   * JWT payload shape: { sub, phone, businessId, role }
   */
  loadFromToken: () => {
    try {
      const token = localStorage.getItem('yookie_auth_token');
      if (!token) return;

      const payload = decodeJwtPayload(token);
      if (!payload) return;

      const businessId = payload.businessId as string | null;
      if (businessId) {
        localStorage.setItem(STORAGE_KEY, businessId);
        set({ merchantId: businessId });
      }
    } catch {
      /* noop */
    }
  },

  loadFromStorage: () => {
    try {
      const id = localStorage.getItem(STORAGE_KEY);
      if (id) set({ merchantId: id });
    } catch {
      /* noop */
    }
  },
}));
