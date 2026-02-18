// app/api/admin/tools/reorder/route.ts
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// POST /api/admin/tools/reorder - bulk-update sortOrder for multiple tools atomically
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const tools: unknown = body?.tools;

  if (
    !Array.isArray(tools) ||
    tools.length === 0 ||
    !tools.every(
      (item) =>
        item !== null &&
        typeof item === "object" &&
        typeof (item as { id: unknown }).id === "string" &&
        typeof (item as { sortOrder: unknown }).sortOrder === "number"
    )
  ) {
    return NextResponse.json(
      { error: "Body must be { tools: [{ id: string, sortOrder: number }] } with at least one item" },
      { status: 400 }
    );
  }

  const items = tools as { id: string; sortOrder: number }[];
  const stmt = db.prepare("UPDATE Tool SET sortOrder = ? WHERE id = ?");

  db.transaction((rows: { id: string; sortOrder: number }[]) => {
    for (const { id, sortOrder } of rows) {
      stmt.run(sortOrder, id);
    }
  })(items);

  return NextResponse.json({ success: true });
}
