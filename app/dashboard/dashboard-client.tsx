"use client";

// app/dashboard/dashboard-client.tsx

import { useEffect, useState, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ServerStats {
  cpu: number | null;
  ram: { used: number; total: number; percent: number } | null;
  disk: { used: string; total: string; percent: number } | null;
  uptime: string | null;
  load: { one: number; five: number; fifteen: number } | null;
  docker: { name: string; status: string; running: boolean }[] | null;
}

interface DashboardConfig {
  cpu: boolean;
  ram: boolean;
  disk: boolean;
  uptime: boolean;
  load: boolean;
  docker: boolean;
}

const DEFAULT_CONFIG: DashboardConfig = {
  cpu: true,
  ram: true,
  disk: true,
  uptime: true,
  load: true,
  docker: true,
};

const CARD_LABELS: Record<keyof DashboardConfig, string> = {
  cpu: "CPU",
  ram: "RAM",
  disk: "Disk",
  uptime: "Uptime",
  load: "Load Average",
  docker: "Docker Containers",
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function GaugeBar({ percent }: { percent: number }) {
  const color =
    percent > 85
      ? "var(--color-coral)"
      : percent > 60
      ? "var(--color-gold)"
      : "var(--color-teal)";
  return (
    <div className="mt-2 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${percent}%`, backgroundColor: color }}
      />
    </div>
  );
}

function StatCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-5 shadow-sm backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-black/40 dark:text-white/40 mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}

function BigNumber({ value, unit }: { value: string | number; unit?: string }) {
  return (
    <p className="text-3xl font-bold text-[var(--foreground)]">
      {value}
      {unit && <span className="text-base font-normal ml-1 opacity-60">{unit}</span>}
    </p>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DashboardClient({ isAdmin }: { isAdmin: boolean }) {
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [config, setConfig] = useState<DashboardConfig>(DEFAULT_CONFIG);
  const [draftConfig, setDraftConfig] = useState<DashboardConfig>(DEFAULT_CONFIG);
  const [configOpen, setConfigOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/server-stats");
      if (res.ok) {
        setStats(await res.json());
        setLastUpdated(new Date());
      }
    } catch {}
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard-config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setDraftConfig(data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [fetchConfig, fetchStats]);

  async function saveConfig() {
    setSaving(true);
    try {
      await fetch("/api/admin/dashboard-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftConfig),
      });
      setConfig(draftConfig);
      setConfigOpen(false);
    } finally {
      setSaving(false);
    }
  }

  // ─── Cards ────────────────────────────────────────────────────────────────

  function renderCards() {
    if (!stats) {
      return (
        <div className="col-span-full text-center py-16 opacity-40">טוען נתונים...</div>
      );
    }

    return (
      <>
        {config.cpu && stats.cpu !== null && (
          <StatCard title="CPU">
            <BigNumber value={stats.cpu} unit="%" />
            <GaugeBar percent={stats.cpu} />
          </StatCard>
        )}

        {config.ram && stats.ram && (
          <StatCard title="RAM">
            <BigNumber value={stats.ram.percent} unit="%" />
            <p className="text-sm opacity-50 mt-1">
              {stats.ram.used} MB / {stats.ram.total} MB
            </p>
            <GaugeBar percent={stats.ram.percent} />
          </StatCard>
        )}

        {config.disk && stats.disk && (
          <StatCard title="Disk">
            <BigNumber value={stats.disk.percent} unit="%" />
            <p className="text-sm opacity-50 mt-1">
              {stats.disk.used} / {stats.disk.total}
            </p>
            <GaugeBar percent={stats.disk.percent} />
          </StatCard>
        )}

        {config.uptime && stats.uptime && (
          <StatCard title="Uptime">
            <p className="text-xl font-semibold text-[var(--foreground)]">{stats.uptime}</p>
          </StatCard>
        )}

        {config.load && stats.load && (
          <StatCard title="Load Average">
            <div className="flex gap-4 mt-1">
              {(
                [
                  ["1m", stats.load.one],
                  ["5m", stats.load.five],
                  ["15m", stats.load.fifteen],
                ] as [string, number][]
              ).map(([label, val]) => (
                <div key={label} className="text-center">
                  <p className="text-xl font-bold text-[var(--foreground)]">{val}</p>
                  <p className="text-xs opacity-40">{label}</p>
                </div>
              ))}
            </div>
          </StatCard>
        )}

        {config.docker && stats.docker && (
          <StatCard title={`Docker (${stats.docker.length})`}>
            <div className="mt-1 flex flex-col gap-1 max-h-48 overflow-y-auto">
              {stats.docker.map((c) => (
                <div key={c.name} className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-mono truncate opacity-80">{c.name}</span>
                  <span
                    className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.running
                        ? "bg-teal-500/20 text-teal-600 dark:text-teal-400"
                        : "bg-red-500/20 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {c.running ? "running" : "stopped"}
                  </span>
                </div>
              ))}
            </div>
          </StatCard>
        )}
      </>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Server Dashboard</h1>
          {lastUpdated && (
            <p className="text-xs opacity-40 mt-0.5">
              עודכן: {lastUpdated.toLocaleTimeString("he-IL")}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchStats}
            className="text-sm px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            רענן
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                setDraftConfig(config);
                setConfigOpen(true);
              }}
              className="text-sm px-3 py-1.5 rounded-lg bg-[var(--color-gold)] text-white hover:opacity-90 transition"
            >
              ⚙️ הגדרות
            </button>
          )}
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {renderCards()}
      </div>

      {/* Config modal */}
      {configOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--background)] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl p-6 w-80">
            <h2 className="text-base font-bold mb-4">הגדרות דשבורד</h2>
            <div className="flex flex-col gap-3">
              {(Object.keys(DEFAULT_CONFIG) as (keyof DashboardConfig)[]).map((key) => (
                <label key={key} className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm">{CARD_LABELS[key]}</span>
                  <input
                    type="checkbox"
                    checked={draftConfig[key]}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({ ...prev, [key]: e.target.checked }))
                    }
                    className="w-4 h-4 accent-[var(--color-gold)]"
                  />
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setConfigOpen(false)}
                className="flex-1 text-sm py-2 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                ביטול
              </button>
              <button
                onClick={saveConfig}
                disabled={saving}
                className="flex-1 text-sm py-2 rounded-lg bg-[var(--color-gold)] text-white hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? "שומר..." : "שמור"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}