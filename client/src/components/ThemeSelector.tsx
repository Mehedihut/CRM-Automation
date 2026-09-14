import { useThemeStore } from "../lib/theme";
import type { Theme } from "../lib/theme";

const OPTIONS: Array<{ value: Theme; label: string; icon: string; title: string }> = [
  { value: "light", label: "Light", icon: "☀", title: "Light theme" },
  { value: "dark", label: "Dark", icon: "🌙", title: "Dark theme" },
  { value: "system", label: "System", icon: "⌨", title: "Match OS theme" },
];

/**
 * Three-button segmented control rendered in the top nav.
 * Lets the user pick a theme; choice persists to localStorage via the
 * useThemeStore persist middleware.
 */
export function ThemeSelector() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  return (
    <div className="theme-selector" role="group" aria-label="Theme">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          title={opt.title}
          aria-label={opt.title}
          aria-pressed={theme === opt.value}
          data-active={theme === opt.value ? "true" : "false"}
          onClick={() => setTheme(opt.value)}
        >
          <span className="theme-icon" aria-hidden="true">
            {opt.icon}
          </span>
          <span className="theme-label">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
