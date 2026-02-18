// app/api/health/route.ts
// Used by Coolify and other orchestration tools for health checks

export async function GET() {
  return Response.json({ status: "ok" }, { status: 200 });
}
