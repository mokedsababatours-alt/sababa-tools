// app/admin/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    redirect("/login?error=unauthorized");
  }

  return (
    <div className="flex-1 p-6 pb-20">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            🏛️ לוח ניהול
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            נהל את המערכת מבקר אחד
          </p>
        </div>

        {/* Admin Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Users Management Card */}
          <Link href="/admin/users" className="group">
            <div className="bg-[var(--bg-tile)] border border-[var(--border)] rounded-2xl p-6 h-full transition-all duration-200 group-hover:border-[var(--accent-gold)] group-hover:shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-3xl">
                  👥
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    ניהול משתמשים
                  </h2>
                  <p className="text-sm text-[var(--text-muted)]">
                    הוסף, הפעל או השבת משתמשים
                  </p>
                </div>
              </div>
              <div className="mt-auto">
                <div className="inline-flex items-center gap-2 text-sm text-[var(--accent-gold)] group-hover:text-[var(--accent-gold)] font-medium">
                  <span>פתח ניהול משתמשים</span>
                  <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Tools Management Card */}
          <Link href="/admin/tools" className="group">
            <div className="bg-[var(--bg-tile)] border border-[var(--border)] rounded-2xl p-6 h-full transition-all duration-200 group-hover:border-[var(--accent-teal)] group-hover:shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-3xl">
                  🧰
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    ניהול כלים
                  </h2>
                  <p className="text-sm text-[var(--text-muted)]">
                    הוסף, ערוך או הפעל כלים
                  </p>
                </div>
              </div>
              <div className="mt-auto">
                <div className="inline-flex items-center gap-2 text-sm text-[var(--accent-teal)] group-hover:text-[var(--accent-teal)] font-medium">
                  <span>פתח ניהול כלים</span>
                  <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Back to Portal */}
        <div className="mt-8 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200"
          >
            <span className="transition-transform duration-200 hover:translate-x-1">←</span>
            <span>חזרה לפורטל הראשי</span>
          </Link>
        </div>
      </div>
    </div>
  );
}