import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const row = db
    .prepare("SELECT config FROM DashboardConfig WHERE id = 'default'")
    .get() as { config: string } | undefined;

  const config = row ? JSON.parse(row.config) : {};
  return NextResponse.json(config);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  db.prepare(
    "INSERT INTO DashboardConfig (id, config) VALUES ('default', ?) ON CONFLICT(id) DO UPDATE SET config = excluded.config"
  ).run(JSON.stringify(body));

  return NextResponse.json({ ok: true });
}