// app/api/chat/sessions/route.ts
import { auth } from "@/lib/auth";
import { createSession, getSessionsForTool } from "@/lib/chat";
import { getToolBySlug } from "@/lib/tools";
import { NextRequest, NextResponse } from "next/server";

// POST /api/chat/sessions - create a new session for a tool
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { toolSlug } = body;

  if (!toolSlug || typeof toolSlug !== "string") {
    return NextResponse.json({ error: "toolSlug is required" }, { status: 400 });
  }

  const tool = getToolBySlug(toolSlug, true);
  if (!tool) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }

  const chatSession = createSession(tool.id);
  return NextResponse.json({ sessionId: chatSession.id });
}

// GET /api/chat/sessions?toolSlug=x - list all sessions for a tool
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const toolSlug = req.nextUrl.searchParams.get("toolSlug");

  if (!toolSlug) {
    return NextResponse.json({ error: "toolSlug query param is required" }, { status: 400 });
  }

  const tool = getToolBySlug(toolSlug, true);
  if (!tool) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }

  const sessions = getSessionsForTool(tool.id);
  return NextResponse.json({ sessions });
}
