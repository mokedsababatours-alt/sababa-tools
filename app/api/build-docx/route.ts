// app/api/build-docx/route.ts
import { NextRequest, NextResponse } from "next/server";
import AdmZip from "adm-zip";
import { parseParagraphs, replaceParaTexts } from "@/lib/docx-paragraphs";

export async function POST(req: NextRequest) {
  // Validate internal secret — this endpoint is called by n8n, not the browser
  const internalSecret = process.env.INTERNAL_API_SECRET;
  const providedSecret = req.headers.get("x-internal-secret");

  if (!internalSecret || providedSecret !== internalSecret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    replacements: Record<string, string>;
    originalBase64: string;
    filename: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { replacements, originalBase64, filename } = body;

  if (!replacements || !originalBase64 || !filename) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Decode original docx
  let originalBuffer: Buffer;
  try {
    originalBuffer = Buffer.from(originalBase64, "base64");
  } catch {
    return NextResponse.json({ error: "Invalid base64" }, { status: 400 });
  }

  // Unpack docx
  let zip: AdmZip;
  try {
    zip = new AdmZip(originalBuffer);
  } catch (err) {
    console.error("[build-docx] adm-zip error:", err);
    return NextResponse.json({ error: "Failed to unpack docx" }, { status: 500 });
  }

  const docEntry = zip.getEntry("word/document.xml");
  if (!docEntry) {
    return NextResponse.json(
      { error: "Invalid docx: word/document.xml not found" },
      { status: 422 }
    );
  }

  let xmlContent = docEntry.getData().toString("utf-8");

  // Parse all paragraphs — same algorithm as enhance-itinerary
  const paragraphs = parseParagraphs(xmlContent);

  // Collect replacements ordered from last to first so character positions stay valid
  const edits: Array<{ start: number; end: number; newXml: string }> = [];

  for (const [indexStr, newText] of Object.entries(replacements)) {
    const idx = parseInt(indexStr, 10);
    if (isNaN(idx) || idx < 0 || idx >= paragraphs.length) {
      console.warn(`[build-docx] paragraph index ${indexStr} out of range (total: ${paragraphs.length})`);
      continue;
    }

    const para = paragraphs[idx];
    const originalPXml = xmlContent.substring(para.start, para.end);
    const newPXml = replaceParaTexts(originalPXml, newText);
    edits.push({ start: para.start, end: para.end, newXml: newPXml });
  }

  // Apply from end to start so earlier positions remain correct
  edits.sort((a, b) => b.start - a.start);
  for (const { start, end, newXml } of edits) {
    xmlContent = xmlContent.substring(0, start) + newXml + xmlContent.substring(end);
  }

  // Write modified XML back into the zip
  zip.updateFile("word/document.xml", Buffer.from(xmlContent, "utf-8"));

  const outputBuffer = zip.toBuffer();
  const baseName = filename.replace(/\.docx$/i, "");
  const outputFilename = `${baseName}_enhanced.docx`;

  return NextResponse.json({
    file: outputBuffer.toString("base64"),
    filename: outputFilename,
  });
}
