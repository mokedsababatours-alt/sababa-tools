// components/app-header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ThemeSwitch } from "@/components/theme-switch";
type Props = {
  session: { user?: { name?: string | null; role?: string } } | null;
};

export function AppHeader({ session }: Props) {
  const pathname = usePathname();
  const isToolPage = pathname?.startsWith("/tool/");

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b border-white/20 dark:border-white/10 bg-white/80 dark:bg-[rgba(12,21,40,0.80)] backdrop-blur-md">
      {/* Right side - Logo & optional back */}
      <div className="flex items-center gap-4">
        {isToolPage && (
          <Link
            href="/"
            className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-gold)] transition-colors flex items-center gap-1"
          >
            ← חזרה
          </Link>
        )}
        <Link href={session ? "/" : "/login"} className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
            Sababa Tools
          </h1>
          <span className="text-xs text-[var(--text-muted)] hidden sm:inline">
            פורטל כלים פנימי
          </span>
        </Link>
      </div>

      {/* Left side - Theme, user, admin, logout */}
      <div className="flex items-center gap-3">
        <ThemeSwitch />
        {session?.user && (
          <>
            <span className="text-sm text-[var(--text-secondary)] hidden sm:inline">
              שלום, {session.user.name ?? "משתמש"}
            </span>
            {(session.user as { role?: string }).role === "admin" && (
              <Link
                href="/admin"
                className="text-xs px-3 py-1.5 rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent-gold)] hover:border-[var(--accent-gold)] transition-colors duration-200"
              >
                ניהול
              </Link>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs px-3 py-1.5 rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent-coral)] hover:border-[var(--accent-coral)] transition-colors duration-200"
            >
              יציאה
            </button>
          </>
        )}
      </div>
    </header>
  );
}
