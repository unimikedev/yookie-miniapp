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

function readStoredTheme(): ThemeMode | null {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s === 'light' || s === 'dark' ? s : null;
  } catch {
    return null;
  }
}

function getTimeBasedTheme(): ThemeMode {
  const hour = new Date().getHours();
  return hour >= 20 || hour < 7 ? 'dark' : 'light';
}

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const stored = readStoredTheme();
  if (stored) return stored;
  const tgScheme = window.Telegram?.WebApp?.colorScheme;
  if (tgScheme === 'light' || tgScheme === 'dark') return tgScheme;
  return getTimeBasedTheme();
}

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

// Apply correct theme to DOM immediately at module load (before React renders)
if (typeof window !== 'undefined') {
  applyTheme(getInitialTheme());
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),

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
    const theme = getInitialTheme();
    applyTheme(theme);
    set({ theme });
  },
}));
