/**
 * Theme Store
 * Manages dark/light theme toggle (persisted to localStorage)
 */

import { create } from 'zustand';

type ThemeMode = 'dark' | 'light';

interface ThemeState {
  theme: ThemeMode;
  toggle: () => void;
  setTheme: (theme: ThemeMode) => void;
  loadFromStorage: () => void;
}

const STORAGE_KEY = 'yookie_theme';

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',

  toggle: () => {
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return { theme: next };
    });
  },

  setTheme: (theme: ThemeMode) => {
    applyTheme(theme);
    set({ theme });
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        applyTheme(stored);
        set({ theme: stored });
      } else {
        // Default to dark if nothing stored
        applyTheme('dark');
      }
    } catch {
      // Storage read failed — default to dark
      applyTheme('dark');
    }
  },
}));

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  if (theme === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    root.removeAttribute('data-theme');
  }
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage unavailable
  }
}

// Auto-load from storage on first access
let initialized = false;
if (typeof window !== 'undefined' && !initialized) {
  initialized = true;
  useThemeStore.getState().loadFromStorage();
}
