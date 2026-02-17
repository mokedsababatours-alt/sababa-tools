// components/embed-tool.tsx
"use client";

type Props = {
  url:   string;
  label: string;
};

export function EmbedTool({ url, label }: Props) {
  if (!url) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
        <p>כתובת URL לא הוגדרה לכלי זה</p>
      </div>
    );
  }

  return (
    <iframe
      src={url}
      title={label}
      className="w-full h-full min-h-0 border-0 block"
      allow="clipboard-read; clipboard-write"
      loading="lazy"
    />
  );
}
