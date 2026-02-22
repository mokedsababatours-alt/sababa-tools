"use client";

// components/upload-tool.tsx
import { useRef, useState } from "react";
import type { Tool } from "@/lib/tools";

type UploadState = "idle" | "uploading" | "done" | "error";

const PROCESSING_MESSAGES = [
  "קורא את המסלול...",
  "שולח לעיבוד...",
  "Claude כותב מחדש את התוכן...",
  "בונה את הקובץ החדש...",
  "כמעט מוכן...",
];

export function UploadTool({ tool }: { tool: Tool }) {
  const [state, setState] = useState<UploadState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [msgIndex, setMsgIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const msgIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  function startMessageCycle() {
    setMsgIndex(0);
    let idx = 0;
    msgIntervalRef.current = setInterval(() => {
      idx = (idx + 1) % PROCESSING_MESSAGES.length;
      setMsgIndex(idx);
    }, 4000);
  }

  function stopMessageCycle() {
    if (msgIntervalRef.current) {
      clearInterval(msgIntervalRef.current);
      msgIntervalRef.current = null;
    }
  }

  function handleFileSelect(file: File | null) {
    if (!file) return;
    if (!file.name.endsWith(".docx")) {
      setErrorMsg("יש לבחור קובץ .docx בלבד");
      setState("error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("הקובץ גדול מדי (מקסימום 10MB)");
      setState("error");
      return;
    }
    setSelectedFile(file);
    setState("idle");
    setErrorMsg("");
    setDownloadUrl(null);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFileSelect(e.target.files?.[0] ?? null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    handleFileSelect(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  async function handleSubmit() {
    if (!selectedFile) return;

    setState("uploading");
    setErrorMsg("");
    setDownloadUrl(null);
    startMessageCycle();

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("toolSlug", tool.slug);

      const res = await fetch("/api/enhance-itinerary", {
        method: "POST",
        body: formData,
      });

      stopMessageCycle();

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "שגיאה לא ידועה" }));
        throw new Error(data.error ?? `שגיאה (${res.status})`);
      }

      // Extract filename from Content-Disposition header
      const disposition = res.headers.get("content-disposition") ?? "";
      const filenameMatch = disposition.match(/filename="?([^";\n]+)"?/);
      const filename = filenameMatch
        ? decodeURIComponent(filenameMatch[1])
        : selectedFile.name.replace(".docx", "_enhanced.docx");

      // Create blob URL for download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadFilename(filename);

      // Trigger automatic download
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();

      setState("done");
    } catch (err) {
      stopMessageCycle();
      setErrorMsg(err instanceof Error ? err.message : "שגיאה בעיבוד הקובץ");
      setState("error");
    }
  }

  function handleReset() {
    setState("idle");
    setSelectedFile(null);
    setDownloadUrl(null);
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-auto" dir="rtl">
      <div className="w-full max-w-lg space-y-6">

        {/* ── Idle / file-selected state ──────────────────────────────────── */}
        {(state === "idle" || state === "error") && (
          <>
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative cursor-pointer rounded-2xl border-2 border-dashed
                flex flex-col items-center justify-center gap-3
                px-8 py-12 text-center transition-all duration-200
                ${
                  isDragOver
                    ? "border-[var(--accent-teal)] bg-[color-mix(in_srgb,var(--accent-teal)_8%,transparent)]"
                    : selectedFile
                    ? "border-[var(--accent-gold)] bg-[color-mix(in_srgb,var(--accent-gold)_6%,transparent)]"
                    : "border-[var(--border)] hover:border-[var(--accent-gold)] hover:bg-[color-mix(in_srgb,var(--accent-gold)_4%,transparent)]"
                }
              `}
            >
              <span className="text-4xl select-none">
                {selectedFile ? "📄" : "📁"}
              </span>

              {selectedFile ? (
                <div className="space-y-1">
                  <p className="text-base font-semibold text-[var(--text-primary)]">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {(selectedFile.size / 1024).toFixed(0)} KB · לחץ להחלפת הקובץ
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-base font-semibold text-[var(--text-primary)]">
                    גרור קובץ לכאן
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    או לחץ לבחירת קובץ .docx
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".docx"
                className="hidden"
                onChange={handleInputChange}
              />
            </div>

            {/* Error message */}
            {state === "error" && errorMsg && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[color-mix(in_srgb,var(--accent-coral)_12%,transparent)] border border-[var(--accent-coral)]">
                <span className="text-lg flex-shrink-0">⚠️</span>
                <p className="text-sm text-[var(--accent-coral)] font-medium">{errorMsg}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="button"
              disabled={!selectedFile}
              onClick={handleSubmit}
              className="
                w-full py-3 rounded-xl font-semibold text-base
                bg-[color-mix(in_srgb,var(--accent-teal)_85%,transparent)]
                border border-white/20 text-white
                hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-200
              "
            >
              {selectedFile ? "✨ שפר את המסלול" : "בחר קובץ תחילה"}
            </button>
          </>
        )}

        {/* ── Uploading / processing state ─────────────────────────────────── */}
        {state === "uploading" && (
          <div className="flex flex-col items-center gap-6 py-8">
            {/* Spinner */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-[var(--border)]" />
              <div className="absolute inset-0 rounded-full border-4 border-t-[var(--accent-teal)] animate-spin" />
            </div>

            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {PROCESSING_MESSAGES[msgIndex]}
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                הפעולה עשויה להימשך 30–60 שניות
              </p>
            </div>

            <div className="flex gap-1.5">
              {PROCESSING_MESSAGES.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === msgIndex
                      ? "w-6 bg-[var(--accent-teal)]"
                      : "w-1.5 bg-[var(--border)]"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Done state ────────────────────────────────────────────────────── */}
        {state === "done" && (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="w-16 h-16 rounded-full bg-[color-mix(in_srgb,var(--accent-teal)_15%,transparent)] flex items-center justify-center">
              <span className="text-3xl">✅</span>
            </div>

            <div className="text-center space-y-1">
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                המסלול שופר בהצלחה!
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                הקובץ הורד אוטומטית. אם ההורדה לא החלה, לחץ כאן:
              </p>
            </div>

            {downloadUrl && (
              <a
                href={downloadUrl}
                download={downloadFilename}
                className="
                  flex items-center gap-2 px-6 py-3 rounded-xl
                  bg-[color-mix(in_srgb,var(--accent-teal)_85%,transparent)]
                  border border-white/20 text-white font-semibold text-sm
                  hover:opacity-90 transition-opacity
                "
              >
                <span>⬇️</span>
                <span>הורד {downloadFilename}</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="
                text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]
                underline underline-offset-2 transition-colors
              "
            >
              עבד קובץ נוסף
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
