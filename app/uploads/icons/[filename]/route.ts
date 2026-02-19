// app/uploads/icons/[filename]/route.ts
// Serves uploaded tool icons from disk (avoids Next.js static serving quirks in standalone mode)

import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
};

function getContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

function isSafeFilename(filename: string): boolean {
  // Reject path traversal and invalid characters
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return false;
  }
  // Allow alphanumeric, hyphen, underscore, dot, and common image extensions
  return /^[a-zA-Z0-9_-]+\.[a-z]+$/.test(filename);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  if (!filename || !isSafeFilename(filename)) {
    return new NextResponse(null, { status: 404 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "icons");
  const filePath = path.resolve(uploadDir, filename);

  // Ensure resolved path is still inside upload dir (path traversal guard)
  const realUploadDir = path.resolve(uploadDir);
  if (!filePath.startsWith(realUploadDir)) {
    return new NextResponse(null, { status: 404 });
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return new NextResponse(null, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  const contentType = getContentType(filename);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
