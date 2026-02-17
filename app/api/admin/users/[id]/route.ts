// app/api/admin/users/[id]/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Prevent admin from deactivating themselves
  if ((session.user as any).id === id) {
    return NextResponse.json(
      { error: "לא ניתן לשנות את הסטטוס של המשתמש שלך" },
      { status: 400 }
    );
  }

  const { active } = await req.json();

  const user = await prisma.user.update({
    where: { id },
    data:  { active: Boolean(active) },
    select: { id: true, active: true },
  });

  return NextResponse.json({ user });
}
