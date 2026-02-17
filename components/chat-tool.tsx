// components/chat-tool.tsx
"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  id:      string;
  role:    "user" | "ai";
  content: string;
  time:    string;
};

type Props = {
  toolSlug:   string;
  labelHe:    string;
  webhookUrl: string;
};

function now() {
  return new Date().toLocaleTimeString("he-IL", {
    hour:   "2-digit",
    minute: "2-digit",
  });
}

export function ChatTool({ toolSlug, labelHe, webhookUrl }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    if (!webhookUrl) {
      setError("כתובת ה-webhook לא הוגדרה — פנה למנהל");
      return;
    }

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
        body:    JSON.stringify({ message: text, toolSlug }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "שגיאה לא ידועה");

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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Send on Enter (not Shift+Enter)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div
      className="flex flex-col bg-[var(--bg-base)]"
      style={{ height: "calc(100vh - 57px)" }}
    >
      {/* ── Message area ────────────────────────────────────────────────── */}
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
          <div className="text-center text-sm text-[var(--accent-coral)] px-4 py-2 rounded-xl bg-[color-mix(in_srgb,var(--accent-coral)_10%,transparent)]">
            ⚠️ {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input area ──────────────────────────────────────────────────── */}
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
            rounded-2xl px-4 py-2.5
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
            w-10 h-10 rounded-xl flex-shrink-0
            bg-[var(--accent-gold)] text-white
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
  );
}
