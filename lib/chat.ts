import { db, generateId } from "@/lib/db";

export interface ChatSession {
  id: string;
  toolId: string;
  title?: string | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "ai";
  content: string;
  createdAt: string;
}

export function createSession(toolId: string): ChatSession {
  const id = generateId();
  const createdAt = new Date().toISOString();
  db.prepare("INSERT INTO ChatSession (id, toolId, createdAt) VALUES (?, ?, ?)").run(id, toolId, createdAt);
  return { id, toolId, createdAt };
}

export function addMessage(sessionId: string, role: "user" | "ai", content: string): ChatMessage {
  const id = generateId();
  const createdAt = new Date().toISOString();
  db.prepare("INSERT INTO ChatMessage (id, sessionId, role, content, createdAt) VALUES (?, ?, ?, ?, ?)").run(
    id,
    sessionId,
    role,
    content,
    createdAt
  );
  return { id, sessionId, role, content, createdAt };
}

export function getSessionsForTool(toolId: string): ChatSession[] {
  return db
    .prepare("SELECT * FROM ChatSession WHERE toolId = ? ORDER BY createdAt DESC")
    .all(toolId) as ChatSession[];
}

export function getMessagesForSession(sessionId: string): ChatMessage[] {
  return db
    .prepare("SELECT * FROM ChatMessage WHERE sessionId = ? ORDER BY createdAt ASC")
    .all(sessionId) as ChatMessage[];
}

export function updateSessionTitle(sessionId: string, title: string): void {
  db.prepare("UPDATE ChatSession SET title = ? WHERE id = ?").run(title, sessionId);
}

export function deleteSession(sessionId: string): void {
  db.transaction(() => {
    db.prepare("DELETE FROM ChatMessage WHERE sessionId = ?").run(sessionId);
    db.prepare("DELETE FROM ChatSession WHERE id = ?").run(sessionId);
  })();
}
