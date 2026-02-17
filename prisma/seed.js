// prisma/seed.js
// Run once: npm run db:seed

const { PrismaClient } = require('@prisma/client')
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')
const bcrypt = require('bcryptjs')

const url = process.env.DATABASE_URL ?? 'file:./prisma/portal.db'
const adapter = new PrismaBetterSqlite3({ url })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding database...");

  // ── Admin user ──────────────────────────────────────────────────────────────
  const email    = process.env.ADMIN_EMAIL    || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "changeme123";
  const name     = process.env.ADMIN_NAME     || "מנהל";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: { email, name, password: hashed, role: "admin" },
    });
    console.log(`✅ Admin user created: ${email}`);
  } else {
    console.log(`⏭  Admin user already exists: ${email}`);
  }

  // ── Default tools ───────────────────────────────────────────────────────────
  const tools = [
    // Team portal tools
    {
      slug: "n8n",
      labelHe: "אוטומציה",
      labelEn: "Automation (n8n)",
      icon: "⚙️",
      type: "embed",
      url: "http://localhost:5678",   // update to your n8n URL
      color: "teal",
      portal: "admin",
      order: 1,
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
      order: 2,
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
      order: 3,
    },
    {
      slug: "whatsapp",
      labelHe: "וואטסאפ",
      labelEn: "WhatsApp Interface",
      icon: "📱",
      type: "embed",
      url: "http://localhost:3001",   // update to your WhatsApp tool URL
      color: "teal",
      portal: "both",
      order: 4,
    },
  ];

  for (const tool of tools) {
    const existingTool = await prisma.tool.findUnique({ where: { slug: tool.slug } });
    if (!existingTool) {
      await prisma.tool.create({ data: tool });
      console.log(`✅ Tool created: ${tool.labelEn}`);
    } else {
      console.log(`⏭  Tool already exists: ${tool.labelEn}`);
    }
  }

  console.log("🎉 Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
