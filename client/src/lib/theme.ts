import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

/**
 * Resolve "system" against the user's OS preference.
 */
function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Compute the effective theme for DOM application, accounting for "system".
 */
export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") return systemPrefersDark() ? "dark" : "light";
  return theme;
}

/**
 * Apply the resolved theme to <html data-theme="...">. This drives the CSS
 * variables in styles.css. Safe to call before React mounts.
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(theme);
  document.documentElement.dataset.theme = resolved;
}

/**
 * The same string used by the inline pre-React script in index.html.
 * Keep these two in sync if you ever rename the storage key.
 */
export const THEME_STORAGE_KEY = "crm-theme";

/**
 * Read the persisted theme synchronously from localStorage. Used by the
 * inline script in index.html to avoid a flash of unstyled content.
 */
export function readPersistedTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return "system";
    const parsed = JSON.parse(raw) as { state?: { theme?: Theme } };
    const t = parsed.state?.theme;
    if (t === "light" || t === "dark" || t === "system") return t;
    return "system";
  } catch {
    return "system";
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: THEME_STORAGE_KEY,
    },
  ),
);

/**
 * Subscribe to system theme changes and re-apply when the user is on "system".
 * Call once at app start (in main.tsx).
 */
export function watchSystemTheme(): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => {
    const { theme } = useThemeStore.getState();
    if (theme === "system") applyTheme("system");
  };
  // Modern API uses addEventListener; older Safari uses addListener.
  if (mq.addEventListener) {
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }
  // Fallback for very old browsers.
  const legacy = mq as unknown as {
    addListener: (cb: () => void) => void;
    removeListener: (cb: () => void) => void;
  };
  legacy.addListener(handler);
  return () => legacy.removeListener(handler);
}
