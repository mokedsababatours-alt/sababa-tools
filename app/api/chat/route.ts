// app/api/chat/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getWebhookUrl } from "@/lib/tools";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Must be authenticated
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { message, toolSlug } = body;

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "חסרה הודעה" }, { status: 400 });
  }

  // Get the tool to find webhook env var name
  const tool = await prisma.tool.findUnique({
    where: { slug: toolSlug, active: true },
  });

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

  try {
    // Forward to n8n
    const n8nRes = await fetch(webhookUrl, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        message,
        user:  session.user.email,
        tool:  toolSlug,
      }),
    });

    if (!n8nRes.ok) {
      throw new Error(`n8n responded with ${n8nRes.status}`);
    }

    const data = await n8nRes.json();

    // n8n can return { reply: "..." } or just a string
    const reply =
      typeof data === "string"
        ? data
        : data.reply ?? data.text ?? data.output ?? data.message ?? JSON.stringify(data);

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("[chat/route]", err);
    return NextResponse.json(
      { error: "שגיאה בחיבור לעוזר — בדוק שה-n8n פועל" },
      { status: 502 }
    );
  }
}
