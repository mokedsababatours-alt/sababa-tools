// components/admin/tools-panel.tsx
"use client";

import { useState, useEffect } from "react";

type Tool = {
  id: string;
  slug: string;
  labelHe: string;
  labelEn: string;
  icon: string;
  type: string;
  url?: string;
  webhookEnv?: string;
  color: string;
  portal: string;
  active: boolean;
  order: number;
};

const inputClass =
  "w-full px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-gold)] transition-colors duration-200 text-sm";

function ToolAccordionRow({
  tool,
  isExpanded,
  onToggle,
  onToggleActive,
  onUpdate,
}: {
  tool: Tool;
  isExpanded: boolean;
  onToggle: () => void;
  onToggleActive: (e: React.MouseEvent) => void;
  onUpdate: (data: Partial<Tool>, e?: React.FormEvent) => void;
}) {
  const [labelHe, setLabelHe] = useState(tool.labelHe);
  const [labelEn, setLabelEn] = useState(tool.labelEn);
  const [icon, setIcon] = useState(tool.icon || "");
  const [type, setType] = useState(tool.type);
  const [url, setUrl] = useState(tool.url || "");
  const [webhookEnv, setWebhookEnv] = useState(tool.webhookEnv || "");
  const [color, setColor] = useState(tool.color);
  const [portal, setPortal] = useState(tool.portal);
  const [order, setOrder] = useState(tool.order);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      setLabelHe(tool.labelHe);
      setLabelEn(tool.labelEn);
      setIcon(tool.icon || "");
      setType(tool.type);
      setUrl(tool.url || "");
      setWebhookEnv(tool.webhookEnv || "");
      setColor(tool.color);
      setPortal(tool.portal);
      setOrder(tool.order);
    }
  }, [isExpanded, tool]);

  const resetForm = () => {
    setLabelHe(tool.labelHe);
    setLabelEn(tool.labelEn);
    setIcon(tool.icon || "");
    setType(tool.type);
    setUrl(tool.url || "");
    setWebhookEnv(tool.webhookEnv || "");
    setColor(tool.color);
    setPortal(tool.portal);
    setOrder(tool.order);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onUpdate(
      { labelHe, labelEn, icon, type, url, webhookEnv, color, portal, order },
      e
    );
    setSaving(false);
  }

  return (
    <div className="border-b border-[var(--border-subtle)] last:border-b-0">
      {/* Header row - clickable to expand */}
      <div
        onClick={onToggle}
        className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-[var(--bg-tile)]/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span
            className={`text-sm transition-transform duration-200 ${
              isExpanded ? "rotate-90" : ""
            }`}
          >
            ▶
          </span>
          <span className="text-2xl">{tool.icon || "🔧"}</span>
          <div>
            <p className="font-medium text-[var(--text-primary)] text-sm">
              {tool.labelHe}
              <span className="me-2 text-xs text-[var(--text-muted)]">
                ({tool.labelEn})
              </span>
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {tool.type} · {tool.portal} · סדר {tool.order}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleActive}
          className={`
            text-xs px-3 py-1.5 rounded-lg border transition-colors duration-200
            ${
              tool.active
                ? "border-[var(--accent-coral)] text-[var(--accent-coral)] hover:bg-[color-mix(in_srgb,var(--accent-coral)_10%,transparent)]"
                : "border-[var(--accent-teal)] text-[var(--accent-teal)] hover:bg-[color-mix(in_srgb,var(--accent-teal)_10%,transparent)]"
            }
          `}
        >
          {tool.active ? "השבת" : "הפעל"}
        </button>
      </div>

      {/* Expanded edit form */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-2 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/30">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <input
              type="text"
              value={labelHe}
              onChange={(e) => setLabelHe(e.target.value)}
              required
              placeholder="תווית עברית"
              className={inputClass}
              onClick={(e) => e.stopPropagation()}
            />
            <input
              type="text"
              value={labelEn}
              onChange={(e) => setLabelEn(e.target.value)}
              required
              placeholder="תווית אנגלית"
              className={inputClass}
              onClick={(e) => e.stopPropagation()}
            />
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="אייקון (אמוג'י)"
              className={inputClass}
              onClick={(e) => e.stopPropagation()}
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={inputClass}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="link">קישור (link)</option>
              <option value="embed">הטבעה (embed)</option>
              <option value="chat">צ'אט (chat)</option>
            </select>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="כתובת URL"
              className={inputClass}
              onClick={(e) => e.stopPropagation()}
            />
            <input
              type="text"
              value={webhookEnv}
              onChange={(e) => setWebhookEnv(e.target.value)}
              placeholder="שם משתנה Webhook (לכלי chat)"
              className={inputClass}
              onClick={(e) => e.stopPropagation()}
            />
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className={inputClass}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="gold">זהוב</option>
              <option value="teal">תכלת</option>
              <option value="coral">קורל</option>
              <option value="default">ברירת מחדל</option>
            </select>
            <select
              value={portal}
              onChange={(e) => setPortal(e.target.value)}
              className={inputClass}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="both">שניהם</option>
              <option value="team">צוות</option>
              <option value="admin">מנהל</option>
            </select>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value) || 0)}
              placeholder="סדר"
              className={inputClass}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="sm:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="
                  py-2.5 px-4 rounded-xl
                  bg-[var(--accent-gold)] text-white font-semibold text-sm
                  hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                "
              >
                {saving ? "שומר..." : "שמור שינויים"}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  resetForm();
                }}
                className="
                  py-2.5 px-4 rounded-xl
                  border border-[var(--border)] text-[var(--text-muted)] text-sm
                  hover:bg-[var(--bg-surface)] transition-colors
                "
              >
                איפוס
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export function ToolsPanel({ initialTools }: { initialTools: Tool[] }) {
  const [tools, setTools] = useState<Tool[]>(initialTools);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [labelHe, setLabelHe] = useState("");
  const [labelEn, setLabelEn] = useState("");
  const [icon, setIcon] = useState("");
  const [type, setType] = useState("link");
  const [url, setUrl] = useState("");
  const [webhookEnv, setWebhookEnv] = useState("");
  const [color, setColor] = useState("default");
  const [portal, setPortal] = useState("both");
  const [order, setOrder] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function addTool(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/admin/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        labelHe,
        labelEn,
        icon,
        type,
        url,
        webhookEnv,
        color,
        portal,
        order: Number(order),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "שגיאה ביצירת כלי");
    } else {
      setTools((prev) => [data.tool, ...prev]);
      setSuccess(`הכלי ${labelHe} נוסף בהצלחה!`);
      setLabelHe("");
      setLabelEn("");
      setIcon("");
      setType("link");
      setUrl("");
      setWebhookEnv("");
      setColor("default");
      setPortal("both");
      setOrder(0);
    }
  }

  async function toggleTool(id: string, active: boolean, e?: React.MouseEvent) {
    e?.stopPropagation();
    const res = await fetch(`/api/admin/tools/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });

    if (res.ok) {
      setTools((prev) =>
        prev.map((t) => (t.id === id ? { ...t, active: !active } : t))
      );
    }
  }

  async function updateTool(
    id: string,
    data: Partial<Omit<Tool, "id" | "slug">>,
    e?: React.FormEvent
  ) {
    e?.preventDefault();
    const res = await fetch(`/api/admin/tools/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const { tool } = await res.json();
      setTools((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...tool } : t))
      );
      setExpandedId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Add tool form */}
      <div className="bg-[var(--bg-tile)] border border-[var(--border)] rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          ➕ הוסף כלי חדש
        </h2>

        {error && (
          <p className="text-sm text-[var(--accent-coral)] mb-3">{error}</p>
        )}
        {success && (
          <p className="text-sm text-[var(--accent-teal)] mb-3">{success}</p>
        )}

        <form onSubmit={addTool} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={labelHe}
            onChange={(e) => setLabelHe(e.target.value)}
            required
            placeholder="תווית עברית"
            className={inputClass}
          />
          <input
            type="text"
            value={labelEn}
            onChange={(e) => setLabelEn(e.target.value)}
            required
            placeholder="תווית אנגלית"
            className={inputClass}
          />
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="אייקון (אמוג'י)"
            className={inputClass}
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={inputClass}
          >
            <option value="link">קישור (link)</option>
            <option value="embed">הטבעה (embed)</option>
            <option value="chat">צ'אט (chat)</option>
          </select>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="כתובת URL"
            className={inputClass}
          />
          <input
            type="text"
            value={webhookEnv}
            onChange={(e) => setWebhookEnv(e.target.value)}
            placeholder="שם משתנה Webhook (לכלי chat)"
            className={inputClass}
          />
          <select
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className={inputClass}
          >
            <option value="gold">זהוב</option>
            <option value="teal">תכלת</option>
            <option value="coral">קורל</option>
            <option value="default">ברירת מחדל</option>
          </select>
          <select
            value={portal}
            onChange={(e) => setPortal(e.target.value)}
            className={inputClass}
          >
            <option value="both">שניהם</option>
            <option value="team">צוות</option>
            <option value="admin">מנהל</option>
          </select>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value) || 0)}
            placeholder="סדר"
            className={inputClass}
          />

          <button
            type="submit"
            disabled={loading}
            className="
              sm:col-span-2 py-2.5 rounded-xl
              bg-[var(--accent-gold)] text-white font-semibold text-sm
              hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
          >
            {loading ? "יוצר כלי..." : "הוסף כלי"}
          </button>
        </form>
      </div>

      {/* Tools list */}
      <div className="bg-[var(--bg-tile)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            כלים ({tools.length})
          </h2>
        </div>

        <div className="divide-y divide-[var(--border-subtle)]">
          {tools.map((tool) => (
            <ToolAccordionRow
              key={tool.id}
              tool={tool}
              isExpanded={expandedId === tool.id}
              onToggle={() =>
                setExpandedId((id) => (id === tool.id ? null : tool.id))
              }
              onToggleActive={(e) => toggleTool(tool.id, tool.active, e)}
              onUpdate={(data, e) => updateTool(tool.id, data, e)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
