// lib/tools.ts
import { prisma } from "@/lib/db";

export type Tool = {
  id: string;
  slug: string;
  labelHe: string;
  labelEn: string;
  icon: string;
  description: string;
  type: string;
  url: string;
  webhookEnv: string;
  color: string;
  portal: string;
  order: number;
};

// Returns webhook URL from env for a chat tool
export function getWebhookUrl(webhookEnv: string): string {
  return process.env[webhookEnv] ?? "";
}

// Fetch tools visible to a given portal context
export async function getToolsForPortal(
  portalType: "team" | "admin"
): Promise<Tool[]> {
  const tools = await prisma.tool.findMany({
    where: {
      active: true,
      portal: portalType === "admin"
        ? { in: ["admin", "both"] }
        : { in: ["team", "both"] },
    },
    orderBy: { order: "asc" },
  });
  return tools;
}
