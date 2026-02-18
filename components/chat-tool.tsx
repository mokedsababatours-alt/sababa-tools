// components/chat-tool.tsx
"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  id:      string;
  role:    "user" | "ai";
  content: string;
  time:    string;
};

type ChatSession = {
  id:        string;
  toolId:    string;
  createdAt: string;
  title?:    string | null;
};

type ChatMessage = {
  id:        string;
  sessionId: string;
  role:      "user" | "ai";
  content:   string;
  createdAt: string;
};

type Props = {
  toolSlug: string;
  labelHe:  string;
};

function now() {
  return new Date().toLocaleTimeString("he-IL", {
    hour:   "2-digit",
    minute: "2-digit",
  });
}

function formatSessionDate(createdAt: string) {
  return new Date(createdAt).toLocaleString("he-IL", {
    day:    "2-digit",
    month:  "2-digit",
    hour:   "2-digit",
    minute: "2-digit",
  });
}

export function ChatTool({ toolSlug, labelHe }: Props) {
  const [messages,        setMessages]        = useState<Message[]>([]);
  const [input,           setInput]           = useState("");
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");
  const [sessionId,       setSessionId]       = useState<string | null>(null);
  const [sessions,        setSessions]        = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Load sessions on mount
  useEffect(() => {
    async function loadSessions() {
      setSessionsLoading(true);
      try {
        const res = await fetch(`/api/chat/sessions?toolSlug=${encodeURIComponent(toolSlug)}`);
        if (!res.ok) return;
        const data = await res.json();
        const sessionList: ChatSession[] = data.sessions ?? [];
        setSessions(sessionList);
        if (sessionList.length > 0) {
          const firstId = sessionList[0].id;
          setSessionId(firstId);
          await loadMessages(firstId);
        }
      } finally {
        setSessionsLoading(false);
      }
    }
    loadSessions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolSlug]);

  async function loadMessages(sid: string) {
    const res = await fetch(`/api/chat/sessions/${sid}/messages`);
    if (!res.ok) return;
    const data = await res.json();
    const msgs: Message[] = (data.messages as ChatMessage[]).map((m) => ({
      id:      m.id,
      role:    m.role,
      content: m.content,
      time:    new Date(m.createdAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
    }));
    setMessages(msgs);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id:      crypto.randomUUID(),
      role:    "user",
      content: text,
      time:    now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          message:   text,
          toolSlug,
          sessionId: sessionId ?? undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "שגיאה לא ידועה");

      // Persist sessionId returned from first message of a new session
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
        setSessions((prev) => {
          if (prev.some((s) => s.id === data.sessionId)) return prev;
          return [{ id: data.sessionId, toolId: "", createdAt: new Date().toISOString() }, ...prev];
        });
      }

      const aiMsg: Message = {
        id:      crypto.randomUUID(),
        role:    "ai",
        content: data.reply,
        time:    now(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setError(err.message ?? "שגיאה בשליחת ההודעה");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  async function handleNewSession() {
    const res = await fetch("/api/chat/sessions", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ toolSlug }),
    });
    if (!res.ok) return;
    const data = await res.json();
    const newId: string = data.sessionId;
    setSessionId(newId);
    setMessages([]);
    setError("");
    setSessions((prev) => [
      { id: newId, toolId: "", createdAt: new Date().toISOString() },
      ...prev,
    ]);
  }

  async function handleSelectSession(sid: string) {
    if (sid === sessionId) return;
    setSessionId(sid);
    setMessages([]);
    setError("");
    await loadMessages(sid);
  }

  async function handleDeleteSession(sid: string) {
    if (!window.confirm("למחוק את השיחה?")) return;
    const res = await fetch(`/api/chat/sessions/${sid}`, { method: "DELETE" });
    if (res.status !== 204) return;

    const remaining = sessions.filter((s) => s.id !== sid);
    setSessions(remaining);

    if (sid === sessionId) {
      if (remaining.length > 0) {
        await handleSelectSession(remaining[0].id);
      } else {
        setSessionId(null);
        setMessages([]);
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Send on Enter (not Shift+Enter)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center bg-[var(--bg-base)] px-4 py-4">

      {/* ── Bounded chat container ────────────────────────────────────────── */}
      <div className="w-full max-w-4xl h-[calc(100vh-120px)] overflow-hidden rounded-lg border border-[var(--border-subtle)] flex flex-row">

        {/* ── Session list sidebar ──────────────────────────────────────── */}
        {/* In RTL flex-row the sidebar renders on the right; border-l is the separator facing the message column */}
        <div className="w-64 flex-shrink-0 flex flex-col bg-[var(--bg-surface)] border-l border-[var(--border-subtle)]">

          {/* New session button */}
          <div className="p-3 border-b border-[var(--border-subtle)] flex-shrink-0">
            <button
              type="button"
              onClick={handleNewSession}
              className="
                w-full py-2 px-3 rounded-lg text-sm font-medium
                bg-[color-mix(in_srgb,var(--accent-teal)_15%,transparent)]
                border border-[var(--accent-teal)] text-[var(--accent-teal)]
                hover:bg-[color-mix(in_srgb,var(--accent-teal)_25%,transparent)]
                transition-colors duration-200
              "
            >
              ＋ שיחה חדשה
            </button>
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto">
            {sessionsLoading ? (
              <div className="flex items-center justify-center h-16 text-xs text-[var(--text-muted)]">
                טוען שיחות...
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex items-center justify-center h-16 text-xs text-[var(--text-muted)] text-center px-3">
                אין שיחות קודמות
              </div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  className={`
                    flex items-center group
                    border-b border-[var(--border-subtle)] last:border-b-0
                    transition-colors duration-150
                    ${s.id === sessionId
                      ? "bg-[color-mix(in_srgb,var(--accent-gold)_12%,transparent)]"
                      : "hover:bg-[var(--bg-tile)]"
                    }
                  `}
                >
                  {/* Session label — clickable */}
                  <button
                    type="button"
                    onClick={() => handleSelectSession(s.id)}
                    className={`
                      flex-1 text-start px-4 py-3 text-xs truncate
                      ${s.id === sessionId
                        ? "text-[var(--text-primary)] font-medium"
                        : "text-[var(--text-secondary)]"
                      }
                    `}
                  >
                    {s.title ? s.title : `💬 ${formatSessionDate(s.createdAt)}`}
                  </button>

                  {/* Trash button — visible on row hover */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
                    title="מחק שיחה"
                    className="
                      px-2 py-3 text-sm flex-shrink-0
                      text-[var(--text-muted)] hover:text-[var(--accent-coral)]
                      opacity-0 group-hover:opacity-100
                      transition-opacity duration-150
                    "
                  >
                    🗑
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Message + input column ───────────────────────────────────────── */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* ── Message area ──────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-muted)] gap-3">
                <span className="text-5xl">💬</span>
                <p className="font-medium text-[var(--text-secondary)]">{labelHe}</p>
                <p className="text-sm max-w-xs">
                  שלח הודעה כדי להתחיל. העוזר יענה דרך n8n.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === "user" ? "justify-start flex-row-reverse" : "justify-start"}`}
              >
                {/* Avatar */}
                <div
                  className={`
                    w-8 h-8 rounded-full flex-shrink-0
                    flex items-center justify-center text-sm
                    ${msg.role === "user"
                      ? "bg-[var(--accent-gold)] text-white"
                      : "bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)]"
                    }
                  `}
                >
                  {msg.role === "user" ? "אני" : "🤖"}
                </div>

                {/* Bubble + time */}
                <div className={`flex flex-col gap-1 max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`
                      px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap
                      ${msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}
                    `}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] px-1">
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-8 h-8 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center text-sm">
                  🤖
                </div>
                <div className="chat-bubble-ai px-4 py-3 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-center text-sm text-[var(--accent-coral)] px-4 py-2 rounded-lg bg-[color-mix(in_srgb,var(--accent-coral)_10%,transparent)]">
                ⚠️ {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Input area ────────────────────────────────────────────────── */}
          <div
            className="
              flex items-end gap-3 px-4 py-4
              border-t border-[var(--border-subtle)]
              bg-[var(--bg-surface)]
            "
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              rows={1}
              placeholder="כתוב הודעה... (Enter לשליחה)"
              className="
                flex-1 resize-none
                bg-[var(--bg-tile)] border border-[var(--border)]
                rounded-xl px-4 py-2.5
                text-sm text-[var(--text-primary)]
                placeholder:text-[var(--text-muted)]
                focus:outline-none focus:border-[var(--accent-gold)]
                transition-colors duration-200
                max-h-32 overflow-y-auto
                disabled:opacity-50
              "
              style={{ lineHeight: "1.5" }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="
                w-10 h-10 rounded-lg flex-shrink-0
                bg-[color-mix(in_srgb,var(--accent-gold)_85%,transparent)]
                backdrop-blur-sm border border-white/20
                text-white
                flex items-center justify-center
                hover:opacity-90 active:opacity-70
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-200
                text-lg
              "
              aria-label="שלח"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "←"
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
