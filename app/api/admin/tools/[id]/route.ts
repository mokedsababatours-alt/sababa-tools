// app/api/admin/tools/[id]/route.ts
import { auth } from "@/lib/auth";
import { updateTool } from "@/lib/tools";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/admin/tools/[id] - update tool (active or full settings)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const data: Partial<{
    labelHe: string;
    labelEn: string;
    icon: string;
    type: string;
    url: string;
    webhookEnv: string;
    color: string;
    portal: string;
    order: number;
    active: boolean;
  }> = {};
  if (typeof body.active === "boolean") data.active = body.active;
  if (typeof body.labelHe === "string" && body.labelHe.trim()) data.labelHe = body.labelHe.trim();
  if (typeof body.labelEn === "string" && body.labelEn.trim()) data.labelEn = body.labelEn.trim();
  if (typeof body.icon === "string") data.icon = body.icon;
  if (["link", "embed", "chat"].includes(body.type)) data.type = body.type;
  if (typeof body.url === "string") data.url = body.url;
  if (typeof body.webhookEnv === "string") data.webhookEnv = body.webhookEnv;
  if (["gold", "teal", "coral", "default"].includes(body.color)) data.color = body.color;
  if (["both", "team", "admin"].includes(body.portal)) data.portal = body.portal;
  if (typeof body.order === "number") data.order = body.order;

  const tool = updateTool(id, data);
  if (!tool) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }

  return NextResponse.json({
    tool: {
      id: tool.id,
      slug: tool.slug,
      labelHe: tool.labelHe,
      labelEn: tool.labelEn,
      icon: tool.icon,
      type: tool.type,
      url: tool.url,
      webhookEnv: tool.webhookEnv,
      color: tool.color,
      portal: tool.portal,
      active: tool.active,
      order: tool.order,
    },
  });
}
