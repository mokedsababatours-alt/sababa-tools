// app/api/admin/tools/[id]/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/admin/tools/[id] - update tool (active or full settings)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const body = await req.json();

  // Partial update: only include provided fields (slug never changed to keep links stable)
  const data: Record<string, unknown> = {};
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

  const tool = await prisma.tool.update({
    where: { id },
    data,
    select: {
      id: true, slug: true, labelHe: true, labelEn: true, icon: true,
      type: true, url: true, webhookEnv: true, color: true, portal: true,
      active: true, order: true,
    },
  });

  return NextResponse.json({ tool });
}
