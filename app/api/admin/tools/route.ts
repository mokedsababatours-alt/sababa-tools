// app/api/admin/tools/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// POST /api/admin/tools - create a new tool
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    labelHe,
    labelEn,
    icon,
    type,
    url,
    webhookEnv,
    color,
    portal,
    order,
  } = await req.json();

  if (!labelHe || !labelEn) {
    return NextResponse.json({ error: "תוויות חובה" }, { status: 400 });
  }

  const slug = slugify(labelEn) || slugify(labelHe) || `tool-${Date.now()}`;
  const exists = await prisma.tool.findUnique({ where: { slug } });
  if (exists) {
    return NextResponse.json(
      { error: "כלי עם slug דומה כבר קיים. שנה את התווית האנגלית." },
      { status: 409 }
    );
  }

  const tool = await prisma.tool.create({
    data: {
      slug,
      labelHe,
      labelEn,
      icon: icon || "🔧",
      type: ["link", "embed", "chat"].includes(type) ? type : "link",
      url: url || "",
      webhookEnv: webhookEnv || "",
      color: ["gold", "teal", "coral", "default"].includes(color)
        ? color
        : "default",
      portal: ["both", "team", "admin"].includes(portal) ? portal : "both",
      order: typeof order === "number" ? order : 0,
    },
    select: {
      id: true,
      slug: true,
      labelHe: true,
      labelEn: true,
      icon: true,
      type: true,
      portal: true,
      active: true,
      order: true,
    },
  });

  return NextResponse.json({ tool }, { status: 201 });
}
