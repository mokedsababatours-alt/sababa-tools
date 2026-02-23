import { execSync } from "child_process";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

function run(cmd: string): string {
  try {
    return execSync(cmd, { timeout: 3000 }).toString().trim();
  } catch {
    return "";
  }
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // CPU usage % (1-second snapshot)
  let cpu: number | null = null;
  try {
    const raw = run("top -bn1 | grep 'Cpu(s)'");
    const match = raw.match(/([\d.]+)\s*id/);
    if (match) cpu = Math.round(100 - parseFloat(match[1]));
  } catch {}

  // RAM
  let ram: { used: number; total: number; percent: number } | null = null;
  try {
    const raw = run("free -m | grep Mem");
    const parts = raw.split(/\s+/);
    const total = parseInt(parts[1]);
    const used = parseInt(parts[2]);
    ram = { used, total, percent: Math.round((used / total) * 100) };
  } catch {}

  // Disk (root partition)
  let disk: { used: string; total: string; percent: number } | null = null;
  try {
    const raw = run("df -h / | tail -1");
    const parts = raw.split(/\s+/);
    disk = {
      total: parts[1],
      used: parts[2],
      percent: parseInt(parts[4]),
    };
  } catch {}

  // Uptime
  let uptime: string | null = null;
  try {
    uptime = run("uptime -p").replace("up ", "");
  } catch {}

  // Load average
  let load: { one: number; five: number; fifteen: number } | null = null;
  try {
    const raw = run("cat /proc/loadavg");
    const parts = raw.split(" ");
    load = {
      one: parseFloat(parts[0]),
      five: parseFloat(parts[1]),
      fifteen: parseFloat(parts[2]),
    };
  } catch {}

  // Docker containers
  let docker: { name: string; status: string; running: boolean }[] | null = null;
  try {
    const raw = run(
      `docker ps -a --format "{{.Names}}|{{.Status}}" 2>/dev/null`
    );
    if (raw) {
      docker = raw
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const [name, ...rest] = line.split("|");
          const status = rest.join("|");
          return { name, status, running: status.toLowerCase().startsWith("up") };
        });
    }
  } catch {}

  return NextResponse.json({ cpu, ram, disk, uptime, load, docker });
}