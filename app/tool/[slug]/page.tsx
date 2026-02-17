// app/tool/[slug]/page.tsx
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getWebhookUrl } from "@/lib/tools";
import { EmbedTool } from "@/components/embed-tool";
import { ChatTool } from "@/components/chat-tool";

type Props = { params: Promise<{ slug: string }> };

export default async function ToolPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { slug } = await params;
  const tool = await prisma.tool.findUnique({
    where: { slug, active: true },
  });

  if (!tool) notFound();

  // Admin-only tools require admin role
  if (tool.portal === "admin" && (session.user as any).role !== "admin") {
    redirect("/?error=forbidden");
  }

  const webhookUrl = tool.type === "chat" ? getWebhookUrl(tool.webhookEnv) : "";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tool content - header with back link is in AppHeader */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {tool.type === "embed" && <EmbedTool url={tool.url} label={tool.labelHe} />}
        {tool.type === "chat" && (
          <ChatTool
            toolSlug={tool.slug}
            labelHe={tool.labelHe}
            webhookUrl={webhookUrl}
          />
        )}
      </div>
    </div>
  );
}
