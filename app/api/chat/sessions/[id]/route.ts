// app/api/chat/sessions/[id]/route.ts
import { auth } from "@/lib/auth";
import { deleteSession } from "@/lib/chat";
import { NextResponse } from "next/server";

// DELETE /api/chat/sessions/[id] - remove a session and all its messages
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  deleteSession(id);

  return new NextResponse(null, { status: 204 });
}
