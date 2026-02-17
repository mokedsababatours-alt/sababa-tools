// app/api/admin/tools/route.ts
import { auth } from "@/lib/auth";
import { getToolBySlug, createTool } from "@/lib/tools";
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
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
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
  const exists = getToolBySlug(slug, false);
  if (exists) {
    return NextResponse.json(
      { error: "כלי עם slug דומה כבר קיים. שנה את התווית האנגלית." },
      { status: 409 }
    );
  }

  const tool = createTool({
    slug,
    labelHe,
    labelEn,
    icon: icon || "🔧",
    type: ["link", "embed", "chat"].includes(type) ? type : "link",
    url: url || "",
    webhookEnv: webhookEnv || "",
    color: ["gold", "teal", "coral", "default"].includes(color) ? color : "default",
    portal: ["both", "team", "admin"].includes(portal) ? portal : "both",
    order: typeof order === "number" ? order : 0,
  });

  return NextResponse.json(
    {
      tool: {
        id: tool.id,
        slug: tool.slug,
        labelHe: tool.labelHe,
        labelEn: tool.labelEn,
        icon: tool.icon,
        type: tool.type,
        portal: tool.portal,
        active: tool.active,
        order: tool.order,
      },
    },
    { status: 201 }
  );
}
