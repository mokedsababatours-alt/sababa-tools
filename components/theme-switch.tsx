// components/theme-switch.tsx
"use client";

import { useTheme } from "@/components/theme-provider";

const SunIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export function ThemeSwitch() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="flex items-center gap-1.5">
      {/* Sun left, Moon right (RTL: first=right, last=left) */}
      <span className="flex items-center justify-center w-5 h-5 text-[var(--text-muted)]" aria-hidden>
        <MoonIcon />
      </span>
      <button
        onClick={toggle}
        aria-label={isDark ? "עבור למצב בהיר" : "עבור למצב כהה"}
        className="
          relative flex items-center
          w-12 h-6 rounded-full
          bg-[var(--bg-tile)] border border-[var(--border)]
          transition-colors duration-200
        "
      >
        <span
          className={`
            absolute top-0.5 h-5 w-5 rounded-full
            bg-[var(--accent-gold)] shadow-sm
            transition-all duration-200 ease-out
            ${isDark ? "start-0.5" : "end-0.5"}
          `}
          aria-hidden
        />
      </button>
      <span className="flex items-center justify-center w-5 h-5 text-[var(--text-muted)]" aria-hidden>
        <SunIcon />
      </span>
    </div>
  );
}
