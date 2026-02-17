// app/admin/tools/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ToolsPanel } from "@/components/admin/tools-panel";

export default async function AdminToolsPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    redirect("/login?error=unauthorized");
  }

  const tools = await prisma.tool.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      slug: true,
      labelHe: true,
      labelEn: true,
      icon: true,
      type: true,
      url: true,
      webhookEnv: true,
      color: true,
      portal: true,
      active: true,
      order: true,
    },
  });

  return (
    <div className="flex-1 p-6 pb-20">
      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              🧰 ניהול כלים
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              הוסף, ערוך או הפעל כלים
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            ← חזרה ללוח ניהול
          </Link>
        </div>
        <ToolsPanel initialTools={tools} />
      </div>
    </div>
  );
}
