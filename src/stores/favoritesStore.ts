/**
 * Favorites Store
 * Manages user's favorite businesses — persisted to localStorage AND synced with backend.
 */

import { create } from 'zustand';
import { api } from '@/lib/api/client';

interface FavoritesState {
  favoriteIds: Set<string>;
  isLoading: boolean;
  initStatus: 'idle' | 'loading' | 'ready' | 'error';
}

interface FavoritesActions {
  toggle: (businessId: string) => void;
  isFavorite: (businessId: string) => boolean;
  addFavorite: (businessId: string) => void;
  removeFavorite: (businessId: string) => void;
  loadFromStorage: () => void;
  syncFromBackend: () => Promise<void>;
  clear: () => void;
  initialize: () => Promise<void>;
}

const STORAGE_KEY = 'yookie_favorites';

// Custom equality function for Set comparison
const setEquals = (a: Set<string>, b: Set<string>): boolean => {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
};

function getPhone(): string | null {
  // Try auth token first
  try {
    const token = localStorage.getItem('yookie_auth_token');
    if (token) {
      // Decode JWT to get phone
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.phone) return payload.phone;
      }
    }
  } catch { /* noop */ }
  // Fallback to booking phone
  try {
    return localStorage.getItem('yookie_booking_phone');
  } catch {
    return null;
  }
}

export const useFavoritesStore = create<FavoritesState & FavoritesActions>((set, get) => ({
  // State
  favoriteIds: new Set<string>(),
  isLoading: false,
  initStatus: 'idle',

  // Actions
  toggle: (businessId: string) => {
    set((state) => {
      const newSet = new Set(state.favoriteIds);
      if (newSet.has(businessId)) {
        newSet.delete(businessId);
      } else {
        newSet.add(businessId);
      }
      // Persist to localStorage immediately
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(newSet)));
      } catch { /* noop */ }

      // Sync with backend (fire-and-forget, non-blocking) with proper error logging
      const phone = getPhone();
      if (phone) {
        if (state.favoriteIds.has(businessId)) {
          api.delete(`/favorites/${businessId}`, { phone }).catch((err) => {
            console.error('[favoritesStore] Failed to remove favorite:', err);
          });
        } else {
          api.post(`/favorites/${businessId}`, {}).catch((err) => {
            console.error('[favoritesStore] Failed to add favorite:', err);
          });
        }
      }

      return { favoriteIds: newSet };
    });
  },

  isFavorite: (businessId: string): boolean => {
    return get().favoriteIds.has(businessId);
  },

  addFavorite: (businessId: string) => {
    set((state) => {
      if (state.favoriteIds.has(businessId)) {
        return state;
      }
      const newSet = new Set(state.favoriteIds);
      newSet.add(businessId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(newSet)));
      } catch { /* noop */ }

      // Sync with backend with proper error logging and rollback
      const phone = getPhone();
      if (phone) {
        api.post(`/favorites/${businessId}`, {}).catch((err) => {
          console.error('[favoritesStore] Failed to add favorite:', err);
          // Rollback on failure
          set((s) => {
            const rollbackSet = new Set(s.favoriteIds);
            rollbackSet.delete(businessId);
            return { favoriteIds: rollbackSet };
          });
        });
      }

      return { favoriteIds: newSet };
    });
  },

  removeFavorite: (businessId: string) => {
    set((state) => {
      if (!state.favoriteIds.has(businessId)) {
        return state;
      }
      const newSet = new Set(state.favoriteIds);
      newSet.delete(businessId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(newSet)));
      } catch { /* noop */ }

      // Sync with backend with proper error logging and rollback
      const phone = getPhone();
      if (phone) {
        api.delete(`/favorites/${businessId}`, { phone }).catch((err) => {
          console.error('[favoritesStore] Failed to remove favorite:', err);
          // Rollback on failure
          set((s) => {
            const rollbackSet = new Set(s.favoriteIds);
            rollbackSet.add(businessId);
            return { favoriteIds: rollbackSet };
          });
        });
      }

      return { favoriteIds: newSet };
    });
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const ids = JSON.parse(stored) as string[];
        const newSet = new Set(ids);
        set((state) => {
          if (!setEquals(state.favoriteIds, newSet)) {
            return { favoriteIds: newSet };
          }
          return state;
        });
      }
    } catch { /* noop */ }
  },

  syncFromBackend: async () => {
    const phone = getPhone();
    if (!phone) return;

    set({ isLoading: true, initStatus: 'loading' });
    try {
      // API client now unwraps { data: T } automatically, so response is directly the array
      const response = await api.get<Array<{ id: string }>>('/favorites', { phone });
      const ids = new Set((response ?? []).map((item: { id: string }) => item.id));
      // Merge with localStorage (union)
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const localIds = JSON.parse(stored) as string[];
          for (const id of localIds) ids.add(id);
        }
      } catch { /* noop */ }

      set({ favoriteIds: ids, isLoading: false, initStatus: 'ready' });
      // Persist merged result
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
      } catch { /* noop */ }
    } catch (err) {
      console.error('[favoritesStore] Failed to sync from backend:', err);
      set({ isLoading: false, initStatus: 'error' });
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* noop */ }
    set({ favoriteIds: new Set<string>(), initStatus: 'idle' });
  },

  initialize: async () => {
    const state = get();
    if (state.initStatus !== 'idle') return; // Already initialized or in progress

    set({ initStatus: 'loading' });
    try {
      state.loadFromStorage();
      await state.syncFromBackend();
      set({ initStatus: 'ready' });
    } catch (err) {
      console.error('[favoritesStore] Initialization failed:', err);
      set({ initStatus: 'error' });
    }
  },
}));

// Promise-based initialization pattern to prevent race conditions
let initPromise: Promise<void> | null = null;

if (typeof window !== 'undefined' && !initPromise) {
  initPromise = useFavoritesStore.getState().initialize();
}
