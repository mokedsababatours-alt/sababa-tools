// app/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getToolsForPortal } from "@/lib/tools";
import { PortalGrid } from "@/components/portal-grid";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userRole = (session.user as { role?: string }).role;
  const portalType: "team" | "admin" = userRole === "admin" ? "admin" : "team";
  const tools = getToolsForPortal(portalType);

  return (
    <div className="flex-1 flex flex-col items-center justify-start pt-8 pb-12">
      <div className="w-full max-w-5xl mx-auto px-6 flex flex-col items-center">
        {/* Sababa Tools logo */}
        <div className="mb-10 text-center">
          <h1
            className="font-display font-bold text-5xl sm:text-6xl md:text-7xl tracking-tight"
            style={{
              background: "linear-gradient(135deg, var(--text-primary) 0%, var(--accent-gold) 50%, var(--accent-teal) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.03em",
            }}
          >
            Sababa Tools
          </h1>
          <div
            className="mt-3 h-0.5 w-24 mx-auto rounded-full opacity-70"
            style={{ background: "linear-gradient(90deg, var(--accent-gold), var(--accent-teal))" }}
          />
        </div>

        {/* Heading + tools - centered block */}
        <div className="w-full flex flex-col items-center">
          <div className="mb-6 text-center">
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
    </div>
  );
}
