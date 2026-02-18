// app/api/chat/sessions/[id]/messages/route.ts
import { auth } from "@/lib/auth";
import { getMessagesForSession } from "@/lib/chat";
import { NextResponse } from "next/server";

// GET /api/chat/sessions/[id]/messages - return all messages for a session
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const messages = getMessagesForSession(id);
  return NextResponse.json({ messages });
}
