// app/api/build-docx/route.ts
import { NextRequest, NextResponse } from "next/server";
import AdmZip from "adm-zip";
import mammoth from "mammoth";

// ─── Section extraction (mirrors enhance-itinerary logic) ────────────────────

const EXCLUDED_SECTION_KEYWORDS = ["כולל", "לא כולל", "ביטול", "מחיר", "תנאי", "הערות"];

function parseHtmlSections(html: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const parts = html.split(/(<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>)/i);
  let currentKey: string | null = null;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const headingMatch = part.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
    if (headingMatch) {
      const headingText = headingMatch[1].replace(/<[^>]+>/g, "").trim();
      const dayMatch = headingText.match(/יום\s*(\d+)/);
      const isExcluded = EXCLUDED_SECTION_KEYWORDS.some((kw) => headingText.includes(kw));
      currentKey = dayMatch && !isExcluded ? `day${dayMatch[1]}` : null;
      continue;
    }
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

// ─── XML paragraph utilities ─────────────────────────────────────────────────

function normalizeForMatch(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function extractParagraphText(pXml: string): string {
  const texts: string[] = [];
  const re = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(pXml)) !== null) {
    texts.push(m[1]);
  }
  return texts.join("");
}

/** Parse a document XML into paragraph entries with their character positions */
function parseParagraphs(xml: string): Array<{ start: number; end: number; text: string }> {
  const result: Array<{ start: number; end: number; text: string }> = [];
  let i = 0;
  while (i < xml.length) {
    const pStart = xml.indexOf("<w:p", i);
    if (pStart === -1) break;

    // Must be <w:p> or <w:p  (not <w:pPr>, <w:pStyle>, etc.)
    const charAfter = xml[pStart + 4];
    if (charAfter !== ">" && charAfter !== " " && charAfter !== "\n" && charAfter !== "\r") {
      i = pStart + 5;
      continue;
    }

    const pEnd = xml.indexOf("</w:p>", pStart);
    if (pEnd === -1) break;

    const end = pEnd + 6;
    const pXml = xml.substring(pStart, end);
    const text = extractParagraphText(pXml);
    result.push({ start: pStart, end, text });
    i = end;
  }
  return result;
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Replace all text inside a <w:p> block with newText.
 * Keeps <w:pPr> and the first run's <w:rPr> for formatting, consolidates into one run.
 */
function replaceParagraphText(pXml: string, newText: string): string {
  // Get the paragraph opening tag (might have attributes like w:rsidR=...)
  const pTagMatch = pXml.match(/^(<w:p(?:\s[^>]*)?>)/);
  const pTag = pTagMatch ? pTagMatch[1] : "<w:p>";

  // Keep paragraph properties
  const pPrMatch = pXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
  const pPr = pPrMatch ? pPrMatch[0] : "";

  // Keep first run's properties for formatting (font, size, color, RTL, etc.)
  const firstRunMatch = pXml.match(/<w:r(?:\s[^>]*)?>[\s\S]*?<\/w:r>/);
  let rPr = "";
  if (firstRunMatch) {
    const rPrMatch = firstRunMatch[0].match(/<w:rPr>[\s\S]*?<\/w:rPr>/);
    rPr = rPrMatch ? rPrMatch[0] : "";
  }

  const escaped = xmlEscape(newText);
  const newRun = `<w:r>${rPr}<w:t xml:space="preserve">${escaped}</w:t></w:r>`;

  return `${pTag}${pPr}${newRun}</w:p>`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Validate internal secret
  const internalSecret = process.env.INTERNAL_API_SECRET;
  const providedSecret = req.headers.get("x-internal-secret");

  if (!internalSecret || providedSecret !== internalSecret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    enhancedTexts: Record<string, string>;
    originalBase64: string;
    filename: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { enhancedTexts, originalBase64, filename } = body;

  if (!enhancedTexts || !originalBase64 || !filename) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Decode original docx
  let originalBuffer: Buffer;
  try {
    originalBuffer = Buffer.from(originalBase64, "base64");
  } catch {
    return NextResponse.json({ error: "Invalid base64" }, { status: 400 });
  }

  // Re-extract sections to get original text fingerprints for matching
  let originalSections: Record<string, string> = {};
  try {
    const result = await mammoth.convertToHtml({ buffer: originalBuffer });
    originalSections = parseHtmlSections(result.value);
  } catch (err) {
    console.error("[build-docx] mammoth error:", err);
    return NextResponse.json({ error: "Failed to read docx" }, { status: 500 });
  }

  // Unpack docx (it's a ZIP file)
  let zip: AdmZip;
  try {
    zip = new AdmZip(originalBuffer);
  } catch (err) {
    console.error("[build-docx] adm-zip error:", err);
    return NextResponse.json({ error: "Failed to unpack docx" }, { status: 500 });
  }

  const docEntry = zip.getEntry("word/document.xml");
  if (!docEntry) {
    return NextResponse.json({ error: "Invalid docx: word/document.xml not found" }, { status: 422 });
  }

  let xmlContent = docEntry.getData().toString("utf-8");

  // Parse paragraphs from the XML
  const paragraphs = parseParagraphs(xmlContent);

  // For each section key, find and replace the corresponding paragraph
  const replacements: Array<{ start: number; end: number; newXml: string }> = [];

  for (const [key, enhancedText] of Object.entries(enhancedTexts)) {
    const originalText = originalSections[key];
    if (!originalText) continue;

    // Use first 25 chars as fingerprint
    const fingerprint = normalizeForMatch(originalText).substring(0, 25);

    // Find matching paragraph
    const match = paragraphs.find((p) => {
      const normalized = normalizeForMatch(p.text).substring(0, 25);
      return normalized === fingerprint && normalized.length > 5;
    });

    if (!match) {
      console.warn(`[build-docx] No paragraph match for key "${key}" (fingerprint: "${fingerprint}")`);
      continue;
    }

    const originalParagraphXml = xmlContent.substring(match.start, match.end);
    const newParagraphXml = replaceParagraphText(originalParagraphXml, enhancedText);
    replacements.push({ start: match.start, end: match.end, newXml: newParagraphXml });
  }

  // Apply replacements from end to start to preserve character positions
  replacements.sort((a, b) => b.start - a.start);
  for (const { start, end, newXml } of replacements) {
    xmlContent = xmlContent.substring(0, start) + newXml + xmlContent.substring(end);
  }

  // Update the zip entry with modified XML
  zip.updateFile("word/document.xml", Buffer.from(xmlContent, "utf-8"));

  // Repack and return
  const outputBuffer = zip.toBuffer();
  const outputBase64 = outputBuffer.toString("base64");

  const baseName = filename.replace(/\.docx$/i, "");
  const outputFilename = `${baseName}_enhanced.docx`;

  return NextResponse.json({ file: outputBase64, filename: outputFilename });
}
