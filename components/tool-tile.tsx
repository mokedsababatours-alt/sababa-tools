// components/tool-tile.tsx
"use client";

import Link from "next/link";
import type { Tool } from "@/lib/tools";

const colorMap: Record<string, string> = {
  gold:    "var(--accent-gold)",
  teal:    "var(--accent-teal)",
  coral:   "var(--accent-coral)",
  default: "var(--border)",
};

export function ToolTile({ tool }: { tool: Tool }) {
  const accent = colorMap[tool.color] ?? colorMap.default;

  const href =
    tool.type === "link"
      ? tool.url
      : `/tool/${tool.slug}`;

  const isExternal = tool.type === "link";

  return (
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="
        portal-tile
        group
        flex flex-col items-center justify-center
        gap-4 p-8
        rounded-3xl
        cursor-pointer
        text-center
        no-underline
        animate-[tilePop_0.3s_cubic-bezier(0.34,1.56,0.64,1)_both]
        min-h-[200px]
      "
      style={{
        borderInlineStartWidth: "4px",
        borderInlineStartColor: accent,
        borderInlineStartStyle: "solid",
      }}
    >
      {/* Icon - bigger ratio */}
      <span
        className="
          text-5xl sm:text-6xl leading-none
          transition-transform duration-300
          group-hover:scale-110
        "
        role="img"
        aria-label={tool.labelEn}
      >
        {tool.icon}
      </span>

      {/* Hebrew label */}
      <span
        className="
          text-lg font-semibold leading-tight
          text-[var(--text-primary)]
          group-hover:text-[var(--accent-gold)]
          transition-colors duration-200
        "
      >
        {tool.labelHe}
      </span>

      {/* Optional description */}
      {tool.description && (
        <span className="text-sm text-[var(--text-muted)] leading-snug">
          {tool.description}
        </span>
      )}
    </Link>
  );
}
