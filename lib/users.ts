import { db, generateId } from "@/lib/db";
import bcrypt from "bcryptjs";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  active: boolean;
  createdAt: string;
};

function rowToUser(row: Record<string, unknown> & { active: number }): User {
  return {
    ...row,
    active: Boolean(row.active),
  } as User;
}

export function findUserByEmail(email: string): User | null {
  const row = db.prepare("SELECT * FROM User WHERE email = ?").get(email) as Record<string, unknown> | undefined;
  if (!row) return null;
  return rowToUser(row as Record<string, unknown> & { active: number });
}

export function findUserById(id: string): User | null {
  const row = db.prepare("SELECT * FROM User WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return rowToUser(row as Record<string, unknown> & { active: number });
}

export function getAllUsers(): User[] {
  const rows = db.prepare("SELECT * FROM User ORDER BY createdAt DESC").all() as (Record<string, unknown> & { active: number })[];
  return rows.map((r) => rowToUser(r));
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role?: string;
}): Promise<User> {
  const hashed = await bcrypt.hash(data.password, 12);
  const id = generateId();
  const role = data.role === "admin" ? "admin" : "user";
  db.prepare(
    "INSERT INTO User (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)"
  ).run(id, data.name, data.email, hashed, role);
  const user = findUserById(id)!;
  return user;
}

export function setUserActive(id: string, active: boolean): User | null {
  const result = db.prepare("UPDATE User SET active = ? WHERE id = ?").run(active ? 1 : 0, id);
  if (result.changes === 0) return null;
  return findUserById(id);
}
