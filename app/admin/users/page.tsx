// app/admin/users/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAllUsers } from "@/lib/users";
import { UsersPanel } from "@/components/admin/users-panel";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    redirect("/login?error=unauthorized");
  }

  const users = getAllUsers();

  return (
    <div className="flex-1 p-6 pb-20">
      <div className="w-full max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              👥 ניהול משתמשים
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              הוסף, הפעל או השבת משתמשים
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            ← חזרה ללוח ניהול
          </Link>
        </div>
        <UsersPanel initialUsers={users} />
      </div>
    </div>
  );
}
