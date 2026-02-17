// app/api/admin/users/[id]/route.ts
import { auth } from "@/lib/auth";
import { setUserActive } from "@/lib/users";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Prevent admin from deactivating themselves
  if ((session.user as { id?: string }).id === id) {
    return NextResponse.json(
      { error: "לא ניתן לשנות את הסטטוס של המשתמש שלך" },
      { status: 400 }
    );
  }

  const { active } = await req.json();

  const user = setUserActive(id, Boolean(active));
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user: { id: user.id, active: user.active } });
}
