import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

function getDbPath(): string {
  const raw = process.env.DATABASE_URL ?? "./data/portal.db";
  if (raw.startsWith("file:")) {
    try {
      const parsed = new URL(raw);
      return parsed.pathname;
    } catch {
      const stripped = raw.slice(5).trim();
      if (path.isAbsolute(stripped)) return stripped;
      return stripped;
    }
  }
  return raw;
}

function resolveDbPath(): string {
  const dbPath = getDbPath();
  if (path.isAbsolute(dbPath)) {
    return dbPath;
  }
  return path.resolve(process.cwd(), dbPath);
}

function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (dir && dir !== ".") {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      // ignore if already exists
    }
  }
}

const globalForDb = globalThis as unknown as { db: Database.Database };

function getDb(): Database.Database {
  if (globalForDb.db) return globalForDb.db;
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

  globalForDb.db = db;
  return db;
}

export const db = getDb();

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}
