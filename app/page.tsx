// app/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getToolsForPortal } from "@/lib/tools";
import { PortalGrid } from "@/components/portal-grid";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userRole = (session.user as any).role;
  const portalType: "team" | "admin" = userRole === "admin" ? "admin" : "team";
  const tools = await getToolsForPortal(portalType);

  return (
    <div className="flex-1 flex flex-col items-center">
      <div className="w-full max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {portalType === "admin" ? "הכלים שלי" : "הכלים שלך"}
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            בחר כלי להתחלה
          </p>
        </div>
        <PortalGrid tools={tools} />
      </div>
    </div>
  );
}
