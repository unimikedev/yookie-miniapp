/**
 * Merchant Store — B2B operational context.
 *
 * Notes on architecture:
 * - B2B and B2C share the SAME backend entities (Business/Merchant, Master/Staff,
 *   Service, Booking, Client). There is no duplicated data model.
 * - This store only tracks which merchant the currently authenticated user
 *   is operating as in "Pro" mode. All reads/writes go through the normal
 *   API layer.
 * - Designed so it can later be moved into a standalone Pro client without
 *   changes: no dependency on B2C-specific stores.
 */

import { create } from 'zustand';

export type ProMode = 'off' | 'on';

interface MerchantState {
  /** Active merchant (Business) id the user manages. Null if not a merchant. */
  merchantId: string | null;
  /** Whether the user is currently viewing Pro surfaces. */
  mode: ProMode;
}

interface MerchantActions {
  setMerchantId: (id: string | null) => void;
  enterProMode: () => void;
  exitProMode: () => void;
  toggleMode: () => void;
  loadFromStorage: () => void;
}

const STORAGE_KEY = 'yookie_pro_merchant_id';

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

  loadFromStorage: () => {
    try {
      const id = localStorage.getItem(STORAGE_KEY);
      if (id) set({ merchantId: id });
    } catch {
      /* noop */
    }
  },
}));
