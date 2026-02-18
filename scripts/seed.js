// scripts/seed.js
// Run once: npm run db:seed

const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

// Load .env so seed uses same DATABASE_URL and ADMIN_* as the app
try {
  const envPath = path.join(process.cwd(), ".env");
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  }
} catch (e) {
  // .env may not exist; continue with defaults
}

function getDbPath() {
  const raw = process.env.DATABASE_URL ?? "./data/portal.db";
  if (raw.startsWith("file:")) {
    try {
      return new URL(raw).pathname;
    } catch {
      const stripped = raw.slice(5).trim();
      return path.isAbsolute(stripped) ? stripped : stripped;
    }
  }
  return raw;
}

function resolveDbPath() {
  const dbPath = getDbPath();
  return path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (dir && dir !== ".") {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      // ignore
    }
  }
}

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

const filePath = resolveDbPath();
ensureDir(filePath);
const db = new Database(filePath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    active INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS Tool (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    labelHe TEXT NOT NULL,
    labelEn TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'link',
    url TEXT NOT NULL DEFAULT '',
    webhookEnv TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT 'default',
    portal TEXT NOT NULL DEFAULT 'both',
    sortOrder INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

console.log("🌱 Seeding database...");

const email = process.env.ADMIN_EMAIL || "admin@example.com";
const password = process.env.ADMIN_PASSWORD || "changeme123";
const name = process.env.ADMIN_NAME || "מנהל";

const existingUser = db.prepare("SELECT id FROM User WHERE email = ?").get(email);
if (!existingUser) {
  const hashed = bcrypt.hashSync(password, 12);
  const id = generateId();
  db.prepare(
    "INSERT INTO User (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)"
  ).run(id, name, email, hashed, "admin");
  console.log(`✅ Admin user created: ${email}`);
} else {
  console.log(`⏭  Admin user already exists: ${email}`);
}

const toolCount = db.prepare("SELECT COUNT(*) as n FROM Tool").get().n;
if (toolCount === 0) {
  const tools = [
    {
      slug: "n8n",
      labelHe: "אוטומציה",
      labelEn: "Automation (n8n)",
      icon: "⚙️",
      type: "embed",
      url: "http://localhost:5678",
      color: "teal",
      portal: "admin",
      sortOrder: 1,
    },
    {
      slug: "marketing-assistant",
      labelHe: "עוזר שיווק",
      labelEn: "Marketing Assistant",
      icon: "✈️",
      type: "chat",
      webhookEnv: "N8N_WEBHOOK_MARKETING",
      color: "gold",
      portal: "both",
      sortOrder: 2,
    },
    {
      slug: "customer-reply",
      labelHe: "תשובות ללקוחות",
      labelEn: "Customer Replies",
      icon: "💬",
      type: "chat",
      webhookEnv: "N8N_WEBHOOK_CUSTOMER",
      color: "coral",
      portal: "both",
      sortOrder: 3,
    },
    {
      slug: "whatsapp",
      labelHe: "וואטסאפ",
      labelEn: "WhatsApp Interface",
      icon: "📱",
      type: "embed",
      url: "http://localhost:3001",
      color: "teal",
      portal: "both",
      sortOrder: 4,
    },
  ];

  const insert = db.prepare(`
    INSERT INTO Tool (id, slug, labelHe, labelEn, icon, description, type, url, webhookEnv, color, portal, sortOrder)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const t of tools) {
    const id = generateId();
    insert.run(
      id,
      t.slug,
      t.labelHe,
      t.labelEn,
      t.icon || "",
      "",
      t.type,
      t.url || "",
      t.webhookEnv || "",
      t.color,
      t.portal,
      t.sortOrder
    );
    console.log(`✅ Tool created: ${t.labelEn}`);
  }
} else {
  console.log("⏭  Tools table already has data, skipping default tools");
}

db.close();
console.log("🎉 Seed complete.");
