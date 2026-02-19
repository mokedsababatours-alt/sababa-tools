// app/api/chat/route.ts
import { auth } from "@/lib/auth";
import { addMessage, createSession, updateSessionTitle } from "@/lib/chat";
import { getToolBySlug, getWebhookUrl } from "@/lib/tools";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { message, toolSlug, sessionId: incomingSessionId } = body;

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "חסרה הודעה" }, { status: 400 });
  }

  const tool = getToolBySlug(toolSlug, true);

  if (!tool || tool.type !== "chat") {
    return NextResponse.json({ error: "כלי לא נמצא" }, { status: 404 });
  }

  const webhookUrl = getWebhookUrl(tool.webhookEnv);

  if (!webhookUrl) {
    return NextResponse.json(
      { error: "Webhook URL not configured" },
      { status: 500 }
    );
  }

  const sessionId: string =
    typeof incomingSessionId === "string" && incomingSessionId.trim()
      ? incomingSessionId.trim()
      : createSession(tool.id).id;

  addMessage(sessionId, "user", message);

  try {
    const n8nRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        message,
        user: session.user.email,
        tool: toolSlug,
      }),
    });

    if (!n8nRes.ok) {
      throw new Error(`n8n responded with ${n8nRes.status}`);
    }

    const data = await n8nRes.json();

    const reply =
      typeof data === "string"
        ? data
        : data.reply ?? data.text ?? data.output ?? data.message ?? JSON.stringify(data);

    addMessage(sessionId, "ai", reply);

    if (typeof data.sessionTitle === "string" && data.sessionTitle.trim()) {
      updateSessionTitle(sessionId, data.sessionTitle.trim());
    }

    return NextResponse.json({ reply, sessionId });
  } catch (err) {
    console.error("[chat/route]", err);
    return NextResponse.json(
      { error: "שגיאה בחיבור לעוזר — בדוק שה-n8n פועל" },
      { status: 502 }
    );
  }
}
