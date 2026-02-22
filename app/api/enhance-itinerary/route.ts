// app/api/enhance-itinerary/route.ts
import { auth } from "@/lib/auth";
import { getToolBySlug, getWebhookUrl } from "@/lib/tools";
import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";

// ─── Section extraction ───────────────────────────────────────────────────────

const EXCLUDED_SECTION_KEYWORDS = ["כולל", "לא כולל", "ביטול", "מחיר", "תנאי", "הערות"];

function parseHtmlSections(html: string): Record<string, string> {
  const sections: Record<string, string> = {};

  // Split on heading tags
  const parts = html.split(/(<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>)/i);

  let currentKey: string | null = null;
  let dayCounter: Record<string, number> = {};

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    // Check if this chunk is a heading
    const headingMatch = part.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
    if (headingMatch) {
      const headingText = headingMatch[1].replace(/<[^>]+>/g, "").trim();

      // Check for day heading
      const dayMatch = headingText.match(/יום\s*(\d+)/);
      const isExcluded = EXCLUDED_SECTION_KEYWORDS.some((kw) => headingText.includes(kw));

      if (dayMatch && !isExcluded) {
        currentKey = `day${dayMatch[1]}`;
      } else {
        // Stop collecting if we hit a non-day heading
        currentKey = null;
      }
      continue;
    }

    // If we're inside a day section, extract the first substantial paragraph
    if (currentKey && !sections[currentKey]) {
      const pMatches = part.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
      for (const m of pMatches) {
        const text = m[1].replace(/<[^>]+>/g, "").trim();
        if (text.length > 30) {
          sections[currentKey] = text;
          break;
        }
      }
    }
  }

  return sections;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const toolSlug = formData.get("toolSlug") as string | null;

  if (!file) {
    return NextResponse.json({ error: "לא הועלה קובץ" }, { status: 400 });
  }
  if (!toolSlug) {
    return NextResponse.json({ error: "חסר מזהה הכלי" }, { status: 400 });
  }
  if (!file.name.endsWith(".docx")) {
    return NextResponse.json({ error: "יש להעלות קובץ .docx בלבד" }, { status: 400 });
  }

  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "הקובץ גדול מדי (מקסימום 10MB)" }, { status: 413 });
  }

  const tool = getToolBySlug(toolSlug, true);
  if (!tool || tool.type !== "upload") {
    return NextResponse.json({ error: "כלי לא נמצא" }, { status: 404 });
  }

  const webhookUrl = getWebhookUrl(tool.webhookEnv);
  if (!webhookUrl) {
    return NextResponse.json({ error: "Webhook URL not configured" }, { status: 500 });
  }

  // Read file as buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const originalBase64 = buffer.toString("base64");

  // Extract text with mammoth
  let sections: Record<string, string> = {};
  try {
    const result = await mammoth.convertToHtml({ buffer });
    sections = parseHtmlSections(result.value);
  } catch (err) {
    console.error("[enhance-itinerary] mammoth error:", err);
    return NextResponse.json({ error: "שגיאה בקריאת הקובץ" }, { status: 500 });
  }

  if (Object.keys(sections).length === 0) {
    return NextResponse.json(
      { error: "לא נמצאו חלקים מתאימים במסמך — ודא שהמסמך מכיל כותרות 'יום X'" },
      { status: 422 }
    );
  }

  // Call n8n webhook
  let n8nResponse: { file: string; filename: string };
  try {
    const n8nRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        originalBase64,
        filename: file.name,
        texts: sections,
      }),
    });

    if (!n8nRes.ok) {
      const errText = await n8nRes.text().catch(() => "");
      console.error("[enhance-itinerary] n8n error:", n8nRes.status, errText);
      throw new Error(`n8n responded with ${n8nRes.status}`);
    }

    n8nResponse = await n8nRes.json();
  } catch (err) {
    console.error("[enhance-itinerary] webhook error:", err);
    return NextResponse.json(
      { error: "שגיאה בחיבור לשירות — בדוק שה-n8n פועל" },
      { status: 502 }
    );
  }

  if (!n8nResponse.file || !n8nResponse.filename) {
    return NextResponse.json({ error: "תגובה לא תקינה מה-n8n" }, { status: 502 });
  }

  // Return the enhanced file as a download
  const fileBuffer = Buffer.from(n8nResponse.file, "base64");
  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(n8nResponse.filename)}"`,
      "Content-Length": String(fileBuffer.length),
    },
  });
}
