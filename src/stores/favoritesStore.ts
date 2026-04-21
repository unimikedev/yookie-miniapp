/**
 * Favorites Store
 * Manages user's favorite businesses — persisted to localStorage AND synced with backend.
 */

import { create } from 'zustand';
import { api } from '@/lib/api/client';

interface FavoritesState {
  favoriteIds: Set<string>;
  isLoading: boolean;
}

interface FavoritesActions {
  toggle: (businessId: string) => void;
  isFavorite: (businessId: string) => boolean;
  addFavorite: (businessId: string) => void;
  removeFavorite: (businessId: string) => void;
  loadFromStorage: () => void;
  syncFromBackend: () => Promise<void>;
  clear: () => void;
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

  // Actions
  toggle: (businessId: string) => {
    set((state) => {
      const newSet = new Set(state.favoriteIds);
      const wasFavorited = newSet.has(businessId);
      
      if (wasFavorited) {
        newSet.delete(businessId);
      } else {
        newSet.add(businessId);
      }
      // Persist to localStorage immediately
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(newSet)));
      } catch { /* noop */ }

      // Sync with backend (fire-and-forget, non-blocking but logged)
      const phone = getPhone();
      if (phone) {
        if (wasFavorited) {
          // Was favorited → now removing
          api.delete(`/favorites/${businessId}`, { phone }).catch((err) => {
            console.warn('[favoritesStore] Failed to remove favorite from backend:', err);
            // Note: Local state already updated, backend sync failed
          });
        } else {
          // Was not favorited → now adding
          api.post(`/favorites/${businessId}`, {}).catch((err) => {
            console.warn('[favoritesStore] Failed to add favorite to backend:', err);
            // Note: Local state already updated, backend sync failed
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

      // Sync with backend (logged for visibility)
      const phone = getPhone();
      if (phone) {
        api.post(`/favorites/${businessId}`, {}).catch((err) => {
          console.warn('[favoritesStore] Failed to add favorite to backend:', err);
          // Note: Local state already updated, backend sync failed
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

      // Sync with backend (logged for visibility)
      const phone = getPhone();
      if (phone) {
        api.delete(`/favorites/${businessId}`, { phone }).catch((err) => {
          console.warn('[favoritesStore] Failed to remove favorite from backend:', err);
          // Note: Local state already updated, backend sync failed
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

    set({ isLoading: true });
    try {
      const response = await api.get<{ data: Array<{ id: string }> }>('/favorites', { phone });
      const ids = new Set((response.data ?? []).map((item: { id: string }) => item.id));
      // Merge with localStorage (union)
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const localIds = JSON.parse(stored) as string[];
          for (const id of localIds) ids.add(id);
        }
      } catch { /* noop */ }

      set({ favoriteIds: ids, isLoading: false });
      // Persist merged result
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
      } catch { /* noop */ }
    } catch {
      set({ isLoading: false });
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* noop */ }
    set({ favoriteIds: new Set<string>() });
  },
}));

// Auto-load from storage on first access
let initialized = false;
if (typeof window !== 'undefined' && !initialized) {
  initialized = true;
  const store = useFavoritesStore.getState();
  store.loadFromStorage();
  // Sync from backend in background
  store.syncFromBackend().catch(() => {});
}
