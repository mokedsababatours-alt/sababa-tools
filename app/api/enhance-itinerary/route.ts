// app/api/enhance-itinerary/route.ts
import { auth } from "@/lib/auth";
import { getToolBySlug, getWebhookUrl } from "@/lib/tools";
import { parseParagraphs } from "@/lib/docx-paragraphs";
import { NextRequest, NextResponse } from "next/server";
import AdmZip from "adm-zip";

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
  if (!file.name.toLowerCase().endsWith(".docx")) {
    return NextResponse.json({ error: "יש להעלות קובץ .docx בלבד" }, { status: 400 });
  }
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

  // Read file into buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const originalBase64 = buffer.toString("base64");

  // Unpack docx and extract all paragraphs
  let paragraphs: Array<{ index: number; text: string }>;
  try {
    const zip = new AdmZip(buffer);
    const docEntry = zip.getEntry("word/document.xml");
    if (!docEntry) {
      return NextResponse.json({ error: "קובץ docx לא תקין (word/document.xml חסר)" }, { status: 422 });
    }
    const xmlContent = docEntry.getData().toString("utf-8");
    const parsed = parseParagraphs(xmlContent);
    // Send all paragraphs (index + text) — n8n / Claude decides which to enhance
    paragraphs = parsed.map(({ index, text }) => ({ index, text }));
  } catch (err) {
    console.error("[enhance-itinerary] unpack error:", err);
    return NextResponse.json({ error: "שגיאה בקריאת הקובץ" }, { status: 500 });
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
        paragraphs,
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

  // Stream the enhanced file back as a download
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
