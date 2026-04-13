/**
 * Shows CPU / memory metrics from REST or live Socket.io payload.
 */
export default function SystemPanel({ system, loading, error, live, lastUpdate }) {
  if (loading && !system) {
    return (
      <div className="rounded-2xl border border-slate-700/60 bg-pulse-900/50 p-8 text-center text-slate-400 shadow-card">
        Loading system metrics…
      </div>
    );
  }

  if (error && !system) {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-red-950/30 p-6 text-red-200 shadow-card">
        <p className="font-semibold">Could not load system info</p>
        <p className="mt-1 text-sm opacity-90">{error}</p>
      </div>
    );
  }

  if (!system) return null;

  const { cpu, memory, hostname, platform, uptimeSeconds } = system;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        title="CPU"
        accent={live ? "Live" : "REST"}
        rows={[
          ["Usage", `${cpu?.usagePercent ?? "—"}%`],
          ["Cores", cpu?.cores ?? "—"],
          ["Load (1m)", cpu?.loadAverage?.[0]?.toFixed(2) ?? "—"],
        ]}
        foot={cpu?.model}
      />
      <MetricCard
        title="Memory"
        accent={`${memory?.usedGB ?? "—"} / ${memory?.totalGB ?? "—"} GB`}
        rows={[
          ["Total", `${memory?.totalGB ?? "—"} GB`],
          ["Free", `${memory?.freeGB ?? "—"} GB`],
          ["Used", `${memory?.usedGB ?? "—"} GB`],
        ]}
      />
      <MetricCard
        title="Host"
        accent={platform || "—"}
        rows={[
          ["Hostname", hostname || "—"],
          ["Uptime", formatUptime(uptimeSeconds)],
        ]}
        foot={lastUpdate ? `Updated ${new Date(lastUpdate).toLocaleTimeString()}` : null}
      />
    </div>
  );
}

function MetricCard({ title, accent, rows, foot }) {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-pulse-900/60 p-5 shadow-card backdrop-blur-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
        <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-300">
          {accent}
        </span>
      </div>
      <dl className="mt-4 space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 text-sm">
            <dt className="text-slate-500">{k}</dt>
            <dd className="font-mono text-slate-100">{v}</dd>
          </div>
        ))}
      </dl>
      {foot && <p className="mt-3 border-t border-slate-700/50 pt-3 text-xs text-slate-500">{foot}</p>}
    </div>
  );
}

function formatUptime(sec) {
  if (sec == null || Number.isNaN(sec)) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h ${m}m`;
}
