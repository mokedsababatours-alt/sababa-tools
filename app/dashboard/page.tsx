import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdmin = (session.user as { role?: string }).role === "admin";

  return <DashboardClient isAdmin={isAdmin} />;
}
