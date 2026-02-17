import { db, generateId } from "@/lib/db";

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
  active: boolean;
  createdAt: string;
};

function rowToTool(row: { active: number; sortOrder: number } & Record<string, unknown>): Tool {
  const { sortOrder, active, ...rest } = row;
  return {
    ...rest,
    order: sortOrder,
    active: Boolean(active),
  } as Tool;
}

export function getWebhookUrl(webhookEnv: string): string {
  return process.env[webhookEnv] ?? "";
}

export function getToolsForPortal(portalType: "team" | "admin"): Tool[] {
  const portals = portalType === "admin" ? ["admin", "both"] : ["team", "both"];
  const placeholders = portals.map(() => "?").join(", ");
  const rows = db
    .prepare(
      `SELECT * FROM Tool WHERE active = 1 AND portal IN (${placeholders}) ORDER BY sortOrder ASC`
    )
    .all(...portals) as (Tool & { active: number; sortOrder: number })[];
  return rows.map(rowToTool);
}

export function getAllTools(): Tool[] {
  const rows = db.prepare("SELECT * FROM Tool ORDER BY sortOrder ASC").all() as (Tool & { active: number; sortOrder: number })[];
  return rows.map(rowToTool);
}

export function getToolBySlug(slug: string, activeOnly = true): Tool | null {
  const sql = activeOnly
    ? "SELECT * FROM Tool WHERE slug = ? AND active = 1"
    : "SELECT * FROM Tool WHERE slug = ?";
  const row = db.prepare(sql).get(slug) as (Tool & { active: number; sortOrder: number }) | undefined;
  if (!row) return null;
  return rowToTool(row);
}

export function createTool(data: {
  slug: string;
  labelHe: string;
  labelEn: string;
  icon?: string;
  description?: string;
  type?: string;
  url?: string;
  webhookEnv?: string;
  color?: string;
  portal?: string;
  order?: number;
}): Tool {
  const id = generateId();
  const stmt = db.prepare(`
    INSERT INTO Tool (id, slug, labelHe, labelEn, icon, description, type, url, webhookEnv, color, portal, sortOrder)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    data.slug,
    data.labelHe,
    data.labelEn,
    data.icon ?? "",
    data.description ?? "",
    ["link", "embed", "chat"].includes(data.type ?? "") ? data.type : "link",
    data.url ?? "",
    data.webhookEnv ?? "",
    ["gold", "teal", "coral", "default"].includes(data.color ?? "") ? data.color : "default",
    ["both", "team", "admin"].includes(data.portal ?? "") ? data.portal : "both",
    typeof data.order === "number" ? data.order : 0
  );
  return findToolById(id)!;
}

function findToolById(id: string): Tool | null {
  const row = db.prepare("SELECT * FROM Tool WHERE id = ?").get(id) as (Tool & { active: number; sortOrder: number }) | undefined;
  if (!row) return null;
  return rowToTool(row);
}

export function setToolActive(id: string, active: boolean): Tool | null {
  db.prepare("UPDATE Tool SET active = ? WHERE id = ?").run(active ? 1 : 0, id);
  return findToolById(id);
}

export function updateTool(
  id: string,
  data: Partial<{
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
  }>
): Tool | null {
  const current = findToolById(id);
  if (!current) return null;

  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (typeof data.labelHe === "string" && data.labelHe.trim()) {
    updates.push("labelHe = ?");
    values.push(data.labelHe.trim());
  }
  if (typeof data.labelEn === "string" && data.labelEn.trim()) {
    updates.push("labelEn = ?");
    values.push(data.labelEn.trim());
  }
  if (typeof data.icon === "string") {
    updates.push("icon = ?");
    values.push(data.icon);
  }
  if (["link", "embed", "chat"].includes(data.type ?? "")) {
    updates.push("type = ?");
    values.push(data.type!);
  }
  if (typeof data.url === "string") {
    updates.push("url = ?");
    values.push(data.url);
  }
  if (typeof data.webhookEnv === "string") {
    updates.push("webhookEnv = ?");
    values.push(data.webhookEnv);
  }
  if (["gold", "teal", "coral", "default"].includes(data.color ?? "")) {
    updates.push("color = ?");
    values.push(data.color!);
  }
  if (["both", "team", "admin"].includes(data.portal ?? "")) {
    updates.push("portal = ?");
    values.push(data.portal!);
  }
  if (typeof data.order === "number") {
    updates.push("sortOrder = ?");
    values.push(data.order);
  }
  if (typeof data.active === "boolean") {
    updates.push("active = ?");
    values.push(data.active ? 1 : 0);
  }

  if (updates.length === 0) return current;
  values.push(id);
  db.prepare(`UPDATE Tool SET ${updates.join(", ")} WHERE id = ?`).run(...values);
  return findToolById(id);
}
