// components/admin/tools-panel.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

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
  "w-full px-4 py-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-gold)] transition-colors duration-200 text-sm";

const labelClass = "block text-xs font-medium text-[var(--text-muted)] mb-1";

function isIconUrl(value: string) {
  return value.startsWith("/") || value.startsWith("http");
}

function IconPreview({ value }: { value: string }) {
  if (isIconUrl(value)) {
    return (
      <img
        src={value}
        alt="icon"
        className="w-6 h-6 object-contain"
      />
    );
  }
  return <span className="text-lg leading-none">{value || "🔧"}</span>;
}

const EMOJI_LIST = [
  "🔧","⚙️","🛠️","💡","📊","📈","📉","📋","📌","📎",
  "🗂️","🗃️","📁","📂","🗄️","💼","🖥️","💻","📱","☎️",
  "📞","📟","📠","🖨️","⌨️","🖱️","💾","💿","📀","🖲️",
  "✉️","📧","📨","📩","📤","📥","📦","📫","📬","📭",
  "🌐","🔗","🔍","🔎","🔒","🔓","🔑","🗝️","🛡️","⚠️",
  "✅","❌","❓","❗","💬","💭","🗨️","📢","📣","🔔",
  "⭐","🌟","💫","✨","🎯","🎪","🎨","🎭","🎬","🎤",
  "🚀","✈️","🌍","🌎","🌏","🗺️","🧭","🏔️","🏖️","🏙️",
  "🤖","👤","👥","👨‍💼","👩‍💼","🧑‍💻","👨‍🔧","🧑‍🎨","👨‍🏫","🧑‍⚕️",
  "💰","💳","💵","🏦","📑","🧾","🧮","📐","📏","🔬",
];

function IconField({
  id,
  value,
  onChange,
  stopPropagation = false,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  stopPropagation?: boolean;
}) {
  const [pickerOpen, setPickerOpen]   = useState(false);
  const [uploading,  setUploading]    = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);

  // Close picker on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    if (pickerOpen) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [pickerOpen]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/admin/tools/icon-upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "שגיאת העלאה");
      } else {
        onChange(data.url);
        setPickerOpen(false);
      }
    } catch {
      setUploadError("שגיאת רשת");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function stop(e: React.MouseEvent | React.ChangeEvent) {
    if (stopPropagation) e.stopPropagation();
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      {/* Trigger row: preview + click-to-open button */}
      <div className="flex items-center gap-2">
        <button
          id={id}
          type="button"
          onClick={(e) => { stop(e); setPickerOpen((o) => !o); }}
          title="בחר אייקון"
          className="
            flex items-center gap-2 px-2.5 py-2 rounded-lg
            border border-[var(--border)] bg-[var(--bg-surface)]
            hover:bg-[var(--bg-tile)] transition-colors duration-200
            text-sm text-[var(--text-secondary)]
          "
        >
          <span className="w-6 h-6 flex items-center justify-center flex-shrink-0">
            <IconPreview value={value} />
          </span>
          <span className="text-xs">בחר ▾</span>
        </button>

        {/* Upload button */}
        <button
          type="button"
          disabled={uploading}
          onClick={(e) => { stop(e); fileInputRef.current?.click(); }}
          title="העלה תמונה (PNG/JPG/WebP, עד 200KB)"
          className="
            px-2.5 py-2 rounded-lg text-xs flex-shrink-0
            border border-[var(--border)] text-[var(--text-secondary)]
            bg-[var(--bg-surface)] hover:bg-[var(--bg-tile)]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200 flex items-center gap-1
          "
        >
          {uploading
            ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin inline-block" />
            : "📁"
          }
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Emoji picker popover */}
      {pickerOpen && (
        <div
          className="
            absolute top-full mt-1 z-50 right-0
            w-64 p-2 rounded-lg shadow-lg
            bg-[var(--bg-surface)] border border-[var(--border)]
          "
          onClick={stop as any}
        >
          <div className="grid grid-cols-10 gap-0.5 max-h-48 overflow-y-auto">
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={(e) => { stop(e); onChange(emoji); setPickerOpen(false); }}
                className="
                  w-6 h-6 flex items-center justify-center text-base
                  rounded hover:bg-[var(--bg-tile)]
                  transition-colors duration-100
                "
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {uploadError && (
        <p className="text-xs text-[var(--accent-coral)]">{uploadError}</p>
      )}
    </div>
  );
}

function ToolAccordionRow({
  tool,
  isExpanded,
  onToggle,
  onToggleActive,
  onUpdate,
  onDelete,
}: {
  tool: Tool;
  isExpanded: boolean;
  onToggle: () => void;
  onToggleActive: (e: React.MouseEvent) => void;
  onUpdate: (data: Partial<Tool>, e?: React.FormEvent) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tool.id });

  const dragStyle = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: isDragging ? ("relative" as const) : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  const [labelHe, setLabelHe] = useState(tool.labelHe);
  const [labelEn, setLabelEn] = useState(tool.labelEn);
  const [icon, setIcon] = useState(tool.icon || "");
  const [type, setType] = useState(tool.type);
  const [url, setUrl] = useState(tool.url || "");
  const [webhookEnv, setWebhookEnv] = useState(tool.webhookEnv || "");
  const [color, setColor] = useState(tool.color);
  const [portal, setPortal] = useState(tool.portal);
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
  };

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm("האם למחוק את הכלי?")) return;
    const res = await fetch(`/api/admin/tools/${tool.id}`, { method: "DELETE" });
    if (res.status === 204) {
      onDelete(tool.id);
    } else if (res.status === 404) {
      alert("הכלי לא נמצא.");
    } else {
      alert("שגיאה במחיקת הכלי. נסה שוב.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onUpdate(
      { labelHe, labelEn, icon, type, url, webhookEnv, color, portal },
      e
    );
    setSaving(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      className="border-b border-[var(--border-subtle)] last:border-b-0"
    >
      {/* Header row - clickable to expand */}
      <div
        onClick={onToggle}
        className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-[var(--bg-tile)]/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* Drag handle */}
          <div
            {...listeners}
            {...attributes}
            onClick={(e) => e.stopPropagation()}
            className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-primary)] touch-none select-none px-1 text-base leading-none"
            title="גרור לשינוי סדר"
          >
            ⠿
          </div>
          <span
            className={`text-sm transition-transform duration-200 ${
              isExpanded ? "-rotate-90" : ""
            }`}
          >
            ◀
          </span>
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            {isIconUrl(tool.icon) ? (
              <img src={tool.icon} alt="icon" className="w-7 h-7 object-contain" />
            ) : (
              <span className="text-2xl leading-none">{tool.icon || "🔧"}</span>
            )}
          </div>
          <div>
            <p className="font-medium text-[var(--text-primary)] text-sm">
              {tool.labelHe}
              <span className="me-2 text-xs text-[var(--text-muted)]">
                ({tool.labelEn})
              </span>
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {tool.type} · {tool.portal}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onToggleActive}
            className={`
              text-xs px-3 py-1.5 rounded-md border transition-colors duration-200
              ${
                tool.active
                  ? "border-[var(--accent-coral)] text-[var(--accent-coral)] hover:bg-[color-mix(in_srgb,var(--accent-coral)_10%,transparent)]"
                  : "border-[var(--accent-teal)] text-[var(--accent-teal)] hover:bg-[color-mix(in_srgb,var(--accent-teal)_10%,transparent)]"
              }
            `}
          >
            {tool.active ? "השבת" : "הפעל"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="
              text-xs px-3 py-1.5 rounded-md border transition-colors duration-200
              bg-[color-mix(in_srgb,var(--accent-coral)_15%,transparent)]
              border-[var(--accent-coral)] text-[var(--accent-coral)]
              hover:bg-[color-mix(in_srgb,var(--accent-coral)_30%,transparent)]
              font-semibold
            "
          >
            מחק
          </button>
        </div>
      </div>

      {/* Expanded edit form */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-2 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/30">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <div>
              <label htmlFor={`edit-tool-${tool.id}-label-he`} className={labelClass}>תווית עברית</label>
              <input
                id={`edit-tool-${tool.id}-label-he`}
                type="text"
                value={labelHe}
                onChange={(e) => setLabelHe(e.target.value)}
                required
                className={inputClass}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div>
              <label htmlFor={`edit-tool-${tool.id}-label-en`} className={labelClass}>תווית אנגלית</label>
              <input
                id={`edit-tool-${tool.id}-label-en`}
                type="text"
                value={labelEn}
                onChange={(e) => setLabelEn(e.target.value)}
                required
                className={inputClass}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div>
              <label htmlFor={`edit-tool-${tool.id}-icon`} className={labelClass}>אייקון</label>
              <IconField
                id={`edit-tool-${tool.id}-icon`}
                value={icon}
                onChange={setIcon}
                stopPropagation
              />
            </div>
            <div>
              <label htmlFor={`edit-tool-${tool.id}-type`} className={labelClass}>סוג</label>
              <select
                id={`edit-tool-${tool.id}-type`}
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={inputClass}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="link">קישור (link)</option>
                <option value="embed">הטבעה (embed)</option>
                <option value="chat">צ&#39;אט (chat)</option>
                <option value="upload">העלאת קובץ (upload)</option>
              </select>
            </div>
            {type !== "upload" && (
              <div>
                <label htmlFor={`edit-tool-${tool.id}-url`} className={labelClass}>כתובת URL</label>
                <input
                  id={`edit-tool-${tool.id}-url`}
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className={inputClass}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            {(type === "chat" || type === "upload") && (
              <div>
                <label htmlFor={`edit-tool-${tool.id}-webhook-env`} className={labelClass}>משתנה Webhook</label>
                <input
                  id={`edit-tool-${tool.id}-webhook-env`}
                  type="text"
                  value={webhookEnv}
                  onChange={(e) => setWebhookEnv(e.target.value)}
                  placeholder="שם משתנה סביבה (לכלי chat / upload)"
                  className={inputClass}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            <div>
              <label htmlFor={`edit-tool-${tool.id}-color`} className={labelClass}>צבע</label>
              <select
                id={`edit-tool-${tool.id}-color`}
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
            </div>
            <div>
              <label htmlFor={`edit-tool-${tool.id}-portal`} className={labelClass}>פורטל</label>
              <select
                id={`edit-tool-${tool.id}-portal`}
                value={portal}
                onChange={(e) => setPortal(e.target.value)}
                className={inputClass}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="both">שניהם</option>
                <option value="team">צוות</option>
                <option value="admin">מנהל</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="
                  py-2.5 px-4 rounded-lg
                  bg-[color-mix(in_srgb,var(--accent-gold)_85%,transparent)]
                  backdrop-blur-sm border border-white/20
                  text-white font-semibold text-sm
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
                  py-2.5 px-4 rounded-lg
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [addFormExpanded, setAddFormExpanded] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require 8px movement before activating drag so normal clicks still fire
      activationConstraint: { distance: 8 },
    })
  );

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

  function handleDeleteTool(id: string) {
    setTools((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const previous = tools;
    const oldIndex = tools.findIndex((t) => t.id === active.id);
    const newIndex = tools.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(tools, oldIndex, newIndex);

    setTools(reordered);

    const res = await fetch("/api/admin/tools/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tools: reordered.map((t, i) => ({ id: t.id, sortOrder: i })),
      }),
    });

    if (!res.ok) {
      setTools(previous);
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
      <div className="bg-[var(--bg-tile)] border border-[var(--border)] rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setAddFormExpanded((v) => !v)}
          className="w-full flex items-center gap-3 px-6 py-4 text-start hover:bg-[var(--bg-tile)]/50 transition-colors"
        >
          <span
            className={`text-sm transition-transform duration-200 ${
              addFormExpanded ? "-rotate-90" : ""
            }`}
          >
            ◀
          </span>
          <span className="text-lg font-semibold text-[var(--text-primary)]">
            ➕ הוסף כלי חדש
          </span>
        </button>

        {addFormExpanded && (
          <div className="px-6 pb-6 pt-2 border-t border-[var(--border-subtle)]">
            {error && (
              <p className="text-sm text-[var(--accent-coral)] mb-3">{error}</p>
            )}
            {success && (
              <p className="text-sm text-[var(--accent-teal)] mb-3">{success}</p>
            )}

            <form onSubmit={addTool} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label htmlFor="add-tool-label-he" className={labelClass}>תווית עברית</label>
                <input
                  id="add-tool-label-he"
                  type="text"
                  value={labelHe}
                  onChange={(e) => setLabelHe(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="add-tool-label-en" className={labelClass}>תווית אנגלית</label>
                <input
                  id="add-tool-label-en"
                  type="text"
                  value={labelEn}
                  onChange={(e) => setLabelEn(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="add-tool-icon" className={labelClass}>אייקון</label>
                <IconField
                  id="add-tool-icon"
                  value={icon}
                  onChange={setIcon}
                />
              </div>
              <div>
                <label htmlFor="add-tool-type" className={labelClass}>סוג</label>
                <select
                  id="add-tool-type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className={inputClass}
                >
                  <option value="link">קישור (link)</option>
                  <option value="embed">הטבעה (embed)</option>
                  <option value="chat">צ&#39;אט (chat)</option>
                  <option value="upload">העלאת קובץ (upload)</option>
                </select>
              </div>
              {type !== "upload" && (
                <div>
                  <label htmlFor="add-tool-url" className={labelClass}>כתובת URL</label>
                  <input
                    id="add-tool-url"
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className={inputClass}
                  />
                </div>
              )}
              {(type === "chat" || type === "upload") && (
                <div>
                  <label htmlFor="add-tool-webhook-env" className={labelClass}>משתנה Webhook</label>
                  <input
                    id="add-tool-webhook-env"
                    type="text"
                    value={webhookEnv}
                    onChange={(e) => setWebhookEnv(e.target.value)}
                    placeholder="שם משתנה סביבה (לכלי chat / upload)"
                    className={inputClass}
                  />
                </div>
              )}
              <div>
                <label htmlFor="add-tool-color" className={labelClass}>צבע</label>
                <select
                  id="add-tool-color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className={inputClass}
                >
                  <option value="gold">זהוב</option>
                  <option value="teal">תכלת</option>
                  <option value="coral">קורל</option>
                  <option value="default">ברירת מחדל</option>
                </select>
              </div>
              <div>
                <label htmlFor="add-tool-portal" className={labelClass}>פורטל</label>
                <select
                  id="add-tool-portal"
                  value={portal}
                  onChange={(e) => setPortal(e.target.value)}
                  className={inputClass}
                >
                  <option value="both">שניהם</option>
                  <option value="team">צוות</option>
                  <option value="admin">מנהל</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="
                  sm:col-span-2 py-2.5 rounded-lg
                  bg-[color-mix(in_srgb,var(--accent-gold)_85%,transparent)]
                  backdrop-blur-sm border border-white/20
                  text-white font-semibold text-sm
                  hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                "
              >
                {loading ? "יוצר כלי..." : "הוסף כלי"}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Tools list */}
      <div className="bg-[var(--bg-tile)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            כלים ({tools.length})
          </h2>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tools.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
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
                  onDelete={handleDeleteTool}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
