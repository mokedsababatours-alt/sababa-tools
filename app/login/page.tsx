// app/login/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") ?? "/";
  const errorParam   = searchParams.get("error");

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(
    errorParam === "unauthorized" ? "אין לך הרשאה לגשת לדף זה" : ""
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("אימייל או סיסמה שגויים");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="auth-bg flex-1 flex items-center justify-center p-4">
      <div
        className="
          w-full max-w-sm mx-auto
          bg-[var(--bg-tile)]
            border border-[var(--border)]
            rounded-2xl
            p-8
            shadow-[var(--shadow-hover)]
          "
        >
          {/* Logo area */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
              Sababa Tools
            </h1>
            <p className="text-sm text-[var(--text-muted)]">כניסה לפורטל</p>
          </div>

          {/* Error */}
        {error && (
          <div
            className="
              mb-5 px-4 py-3 rounded-lg
              bg-[color-mix(in_srgb,var(--accent-coral)_10%,transparent)]
              border border-[color-mix(in_srgb,var(--accent-coral)_30%,transparent)]
              text-[var(--accent-coral)] text-sm text-center
            "
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              אימייל
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="
                w-full px-4 py-2.5 rounded-lg
                bg-[var(--bg-surface)]
                border border-[var(--border)]
                text-[var(--text-primary)]
                placeholder:text-[var(--text-muted)]
                focus:outline-none focus:border-[var(--accent-gold)]
                transition-colors duration-200
                text-sm
              "
              placeholder="you@agency.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              סיסמה
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="
                w-full px-4 py-2.5 rounded-lg
                bg-[var(--bg-surface)]
                border border-[var(--border)]
                text-[var(--text-primary)]
                placeholder:text-[var(--text-muted)]
                focus:outline-none focus:border-[var(--accent-gold)]
                transition-colors duration-200
                text-sm
              "
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="
              mt-2 w-full py-3 rounded-lg
              bg-[color-mix(in_srgb,var(--accent-gold)_85%,transparent)]
              backdrop-blur-sm border border-white/25
              text-white font-semibold text-sm
              hover:opacity-90 active:opacity-80
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              shadow-md hover:shadow-lg
            "
          >
            {loading ? "מתחבר..." : "כניסה"}
          </button>
        </form>

        <p className="text-xs text-center text-[var(--text-muted)] mt-6">
          אין לך חשבון? פנה למנהל המערכת
        </p>
      </div>
    </div>
  );
}
