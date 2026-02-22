// lib/docx-paragraphs.ts
// Shared docx paragraph utilities used by both enhance-itinerary and build-docx.
// Both routes MUST import from here so paragraph counting is always identical.

export interface DocxParagraph {
  /** Zero-based position index in the paragraphs array */
  index: number;
  /** Character offset of <w:p… in the document XML */
  start: number;
  /** Character offset immediately after </w:p> */
  end: number;
  /** Concatenated text of all <w:t> elements in this paragraph */
  text: string;
}

/**
 * Parse every <w:p> element from a document XML string.
 * Every paragraph is counted, including empty ones.
 * <w:pPr>, <w:pStyle> and any other w:p* elements are intentionally skipped.
 */
export function parseParagraphs(xml: string): DocxParagraph[] {
  const result: DocxParagraph[] = [];
  let i = 0;

  while (i < xml.length) {
    const pStart = xml.indexOf("<w:p", i);
    if (pStart === -1) break;

    // The character at position pStart+4 must be '>', ' ', '\t', '\n', or '\r'.
    // This filters out <w:pPr>, <w:pStyle>, <w:pBdr>, <w:pFonts>, etc.
    const c = xml[pStart + 4];
    if (c !== ">" && c !== " " && c !== "\t" && c !== "\n" && c !== "\r") {
      i = pStart + 5;
      continue;
    }

    const closePos = xml.indexOf("</w:p>", pStart);
    if (closePos === -1) break;

    const end = closePos + 6; // length of "</w:p>"
    const pXml = xml.substring(pStart, end);

    result.push({
      index: result.length,
      start: pStart,
      end,
      text: extractParaText(pXml),
    });

    i = end;
  }

  return result;
}

/** Concatenate all <w:t> values inside one <w:p> block. */
export function extractParaText(pXml: string): string {
  const parts: string[] = [];
  // <w:t> may have attributes (e.g. xml:space="preserve")
  const re = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(pXml)) !== null) {
    parts.push(m[1]);
  }
  return parts.join("");
}

/** Escape a string for safe inclusion in XML text nodes. */
export function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Replace the text content of a single <w:p> block with newText.
 *
 * Strategy: iterate every <w:t> element in document order.
 * – The first <w:t> receives the full new text (with xml:space="preserve").
 * – Every subsequent <w:t> is emptied.
 * All <w:pPr>, <w:rPr> and every other structural element are left untouched.
 */
export function replaceParaTexts(pXml: string, newText: string): string {
  let firstSeen = false;
  return pXml.replace(
    /(<w:t(?:\s[^>]*)?>)[^<]*(<\/w:t>)/g,
    (_, openTag: string, closeTag: string) => {
      if (!firstSeen) {
        firstSeen = true;
        // Ensure xml:space="preserve" so leading/trailing spaces are kept
        const tag = openTag.includes("xml:space")
          ? openTag
          : openTag.replace("<w:t", '<w:t xml:space="preserve"');
        return `${tag}${xmlEscape(newText)}${closeTag}`;
      }
      return `${openTag}${closeTag}`;
    }
  );
}
