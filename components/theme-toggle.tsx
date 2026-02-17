// components/theme-toggle.tsx
"use client";

import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "עבור למצב בהיר" : "עבור למצב כהה"}
      className="
        fixed bottom-5 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-2 px-4 py-2
        rounded-full text-sm font-medium
        transition-all duration-300
        border
        bg-[var(--bg-tile)] border-[var(--border)]
        text-[var(--text-secondary)]
        hover:text-[var(--text-primary)] hover:border-[var(--accent-gold)]
        shadow-md hover:shadow-lg
        select-none
      "
    >
      <span className="text-base leading-none">
        {theme === "dark" ? "☀️" : "🌙"}
      </span>
      <span className="hidden sm:inline">
        {theme === "dark" ? "מצב בהיר" : "מצב כהה"}
      </span>
    </button>
  );
}
