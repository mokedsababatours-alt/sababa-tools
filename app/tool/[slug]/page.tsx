// app/tool/[slug]/page.tsx
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getToolBySlug } from "@/lib/tools";
import { EmbedTool } from "@/components/embed-tool";
import { ChatTool } from "@/components/chat-tool";
import { UploadTool } from "@/components/upload-tool";

type Props = { params: Promise<{ slug: string }> };

export default async function ToolPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { slug } = await params;
  const tool = getToolBySlug(slug, true);

  if (!tool) notFound();

  if (tool.portal === "admin" && (session.user as { role?: string }).role !== "admin") {
    redirect("/?error=forbidden");
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Tool title & description ───────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-[var(--border-subtle)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] leading-tight">
          {tool.labelHe}
        </h2>
        {tool.description && (
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{tool.description}</p>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {tool.type === "embed" && <EmbedTool url={tool.url} label={tool.labelHe} />}
        {tool.type === "chat" && (
          <ChatTool
            toolSlug={tool.slug}
            labelHe={tool.labelHe}
          />
        )}
        {tool.type === "upload" && <UploadTool tool={tool} />}
      </div>
    </div>
  );
}
