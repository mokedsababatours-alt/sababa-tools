// components/portal-header.tsx
"use client";

import { signOut } from "next-auth/react";

type Props = {
  userName: string;
  portalType: "team" | "admin";
  userRole?: string;
};

export function PortalHeader({ userName, portalType, userRole }: Props) {
  return (
    <header
      className="
        flex items-center justify-between
        px-6 py-4
        border-b border-[var(--border-subtle)]
        bg-[var(--bg-surface)]
      "
    >
      {/* Right side - Title */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">✈️</span>
        <div>
          <h1 className="text-lg font-bold text-[var(--text-primary)] leading-none">
            {portalType === "admin" ? "פורטל מנהל" : "פורטל הסוכנות"}
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {portalType === "admin" ? "🔐 גישת מנהל" : "כלים פנימיים"}
          </p>
        </div>
      </div>

      {/* Left side - User, Admin link & Logout */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-[var(--text-secondary)] hidden sm:inline">
          שלום, {userName}
        </span>
        {userRole === "admin" && (
          <a
            href="/admin"
            className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent-gold)] hover:border-[var(--accent-gold)] transition-colors duration-200"
          >
            ניהול
          </a>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="
            text-xs px-3 py-1.5 rounded-lg
            border border-[var(--border)]
            text-[var(--text-muted)]
            hover:text-[var(--accent-coral)] hover:border-[var(--accent-coral)]
            transition-colors duration-200
          "
        >
          יציאה
        </button>
      </div>
    </header>
  );
}
