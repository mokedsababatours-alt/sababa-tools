// app/api/admin/tools/icon-upload/route.ts
import { auth } from "@/lib/auth";
import { generateId } from "@/lib/db";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const MAX_BYTES = 200 * 1024; // 200 KB

// POST /api/admin/tools/icon-upload - upload a custom tool icon
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "לא סופק קובץ" }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "סוג קובץ לא נתמך" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "הקובץ גדול מדי (מקסימום 200KB)" }, { status: 400 });
  }

  const filename = `${generateId()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "icons");
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.writeFileSync(path.join(uploadDir, filename), buffer);

  return NextResponse.json({ url: `/uploads/icons/${filename}` });
}
