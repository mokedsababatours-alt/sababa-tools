// components/portal-grid.tsx
import { ToolTile } from "@/components/tool-tile";
import type { Tool } from "@/lib/tools";

export function PortalGrid({ tools }: { tools: Tool[] }) {
  if (tools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[var(--text-muted)]">
        <span className="text-5xl mb-4">🗂️</span>
        <p className="text-lg font-medium">אין כלים להצגה</p>
        <p className="text-sm mt-1">בקש מהמנהל להוסיף כלים לפורטל</p>
      </div>
    );
  }

  return (
    <div
      className="tile-grid grid gap-5 w-full"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
      }}
    >
      {tools.map((tool) => (
        <ToolTile key={tool.id} tool={tool} />
      ))}
    </div>
  );
}
