/**
 * Authentication Store
 * Manages user authentication state and persistence
 */

import { create } from 'zustand';
import { verifyOtp, loginWithGoogle, loginWithTelegram } from '../lib/api/auth';
import { useMerchantStore } from '@/pro/stores/merchantStore';
import { useRecentViewsStore } from './recentViewsStore';
import { useFavoritesStore } from './favoritesStore';
import { useBookingStore } from './bookingStore';

export interface AuthUser {
  id: string;
  phone: string | null;
  email?: string | null;
  name: string;
  avatarUrl?: string | null;
  telegram_id?: bigint;
  /** Business ID if user is a merchant (B2B). Comes from backend JWT. */
  businessId?: string | null;
  /** User role: owner, admin, master */
  role?: string;
}

interface AuthState {
  phone: string | null;
  name: string | null;
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  initStatus: 'idle' | 'loading' | 'ready' | 'error';
}

interface AuthActions {
  login: (phone: string, code: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  telegramLogin: (initData: string) => Promise<void>;
  devLogin: () => void;
  logout: () => void;
  setPhone: (phone: string) => void;
  setName: (name: string) => void;
  updateProfile: (name: string, phone: string, avatarUrl?: string) => void;
  loadFromStorage: () => void;
  clearError: () => void;
  initialize: () => Promise<void>;
}

const STORAGE_KEY = 'yookie_auth_token';
const USER_STORAGE_KEY = 'yookie_auth_user';

export const useAuthStore = create<AuthState & AuthActions>((set, _get) => ({
  // State
  phone: null,
  name: null,
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  initStatus: 'idle',

  // Actions
  login: async (phone: string, code: string) => {
    set({ isLoading: true, error: null });
    try {
      let initData: string | undefined;
      try { const raw = (window as any).Telegram?.WebApp?.initData; initData = raw || undefined; } catch { /* noop */ }
      const response = await verifyOtp(phone, code, initData);
      const { token, user } = response;

      // Store token in localStorage
      try {
        localStorage.setItem(STORAGE_KEY, token);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } catch {
        // Storage unavailable, continue without persistence
      }

      set({
        token,
        user: user as AuthUser,
        phone: user.phone,
        name: user.name,
        isAuthenticated: true,
        isLoading: false,
        initStatus: 'ready',
      });

      // Propagate businessId to merchant store so Pro section has a valid merchantId
      if ((user as AuthUser).businessId) {
        useMerchantStore.getState().setMerchantId((user as AuthUser).businessId!);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      set({ error: message, isLoading: false, initStatus: 'error' });
      throw error;
    }
  },

  telegramLogin: async (initData: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await loginWithTelegram(initData);
      const { token, user } = response;
      try {
        localStorage.setItem(STORAGE_KEY, token);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } catch { /* noop */ }
      set({
        token,
        user: user as AuthUser,
        phone: user.phone,
        name: user.name,
        isAuthenticated: true,
        isLoading: false,
        initStatus: 'ready',
      });
      if ((user as AuthUser).businessId) {
        useMerchantStore.getState().setMerchantId((user as AuthUser).businessId!);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      set({ error: message, isLoading: false, initStatus: 'error' });
      throw error;
    }
  },

  googleLogin: async (credential: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await loginWithGoogle(credential);
      const { token, user } = response;

      try {
        localStorage.setItem(STORAGE_KEY, token);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } catch {
        // Storage unavailable
      }

      set({
        token,
        user: {
          id: user.id,
          phone: user.phone ?? '',
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          businessId: user.businessId,
          role: user.role,
        } as AuthUser,
        phone: user.phone,
        name: user.name,
        isAuthenticated: true,
        isLoading: false,
        initStatus: 'ready',
      });

      if (user.businessId) {
        useMerchantStore.getState().setMerchantId(user.businessId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google login failed';
      set({ error: message, isLoading: false, initStatus: 'error' });
      throw error;
    }
  },

  // DEV ONLY: instant login without OTP — disabled in production builds
  devLogin: () => {
    if (!import.meta.env.DEV) {
      console.warn('devLogin() is disabled in production');
      return;
    }
    const devUser: AuthUser = {
      id: 'dev-admin-001',
      phone: '+998900000000',
      name: 'Admin (Dev)',
    };
    const devToken = 'dev_token_yookie_admin';
    try {
      localStorage.setItem(STORAGE_KEY, devToken);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(devUser));
    } catch { /* noop */ }
    set({
      token: devToken,
      user: devUser,
      phone: devUser.phone,
      name: devUser.name,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  },

  logout: () => {
    const USER_DATA_KEYS = [
      STORAGE_KEY,
      USER_STORAGE_KEY,
      'yookie_user_gender',
      'yookie_booking_phone',
      'yookie_favorites',
      'yookie-recent-views',
    ];
    try {
      for (const key of USER_DATA_KEYS) localStorage.removeItem(key);
    } catch {
      // Storage unavailable
    }

    // Reset all user-specific stores
    useRecentViewsStore.getState().clearHistory();
    useFavoritesStore.getState().clear();
    useBookingStore.getState().reset();

    set({
      phone: null,
      name: null,
      token: null,
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  setPhone: (phone: string) => {
    set({ phone });
  },

  setName: (name: string) => {
    set({ name });
  },

  updateProfile: (name: string, phone: string, avatarUrl?: string) => {
    set((state) => {
      const updatedUser = state.user
        ? { ...state.user, name, phone, ...(avatarUrl !== undefined ? { avatarUrl } : {}) }
        : state.user;
      try {
        if (updatedUser) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      } catch { /* noop */ }
      return { name, phone, user: updatedUser };
    });
  },

  clearError: () => {
    set({ error: null });
  },

  loadFromStorage: () => {
    try {
      const token = localStorage.getItem(STORAGE_KEY);
      const userJson = localStorage.getItem(USER_STORAGE_KEY);

      if (token && userJson) {
        const user = JSON.parse(userJson) as AuthUser;
        set({
          token,
          user,
          phone: user.phone,
          name: user.name,
          isAuthenticated: true,
          initStatus: 'ready',
        });
        if (user.businessId) {
          useMerchantStore.getState().setMerchantId(user.businessId);
        }
      } else {
        set({ initStatus: 'ready' });
      }
    } catch {
      // Storage read failed or invalid data
      set({ initStatus: 'error' });
    }
  },

  initialize: async () => {
    const state = _get();
    if (state.initStatus !== 'idle') return; // Already initialized or in progress

    set({ initStatus: 'loading' });
    try {
      _get().loadFromStorage();
      set({ initStatus: 'ready' });
    } catch (err) {
      console.error('[authStore] Initialization failed:', err);
      set({ initStatus: 'error' });
    }
  },
}));

// Promise-based initialization pattern to prevent race conditions
let authInitPromise: Promise<void> | null = null;

if (typeof window !== 'undefined' && !authInitPromise) {
  authInitPromise = useAuthStore.getState().initialize();
}
