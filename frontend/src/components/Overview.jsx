import { AlertTriangle, Cpu, HardDrive, MemoryStick, Network, Server, ShieldCheck } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

export default function Overview({ system, systemLoading, systemError, status }) {
  const cpu = Number(system?.cpu?.usagePercent ?? 0);
  const memory = Number(system?.memory?.usedPercent ?? 0);
  const disk = Number(system?.disk?.usedPercent ?? 0);
  const network = Number((system?.network?.rxSecKB ?? 0) + (system?.network?.txSecKB ?? 0));
  const uptimeHours = system?.uptime ? Math.floor(system.uptime / 3600) : 0;

  const graphData = [
    { t: "t-10", cpu: Math.max(0, cpu - 7), memory: Math.max(0, memory - 5) },
    { t: "t-8", cpu: Math.max(0, cpu - 4), memory: Math.max(0, memory - 3) },
    { t: "t-6", cpu: Math.max(0, cpu - 2), memory: Math.max(0, memory - 2) },
    { t: "t-4", cpu: Math.max(0, cpu - 1), memory: Math.max(0, memory - 1) },
    { t: "t-2", cpu: Math.max(0, cpu - 0.5), memory: Math.max(0, memory - 0.5) },
    { t: "now", cpu, memory },
  ];

  return (
    <div className="space-y-3 pt-2">
      <section className="panel">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-accent" />
            <h3 className="text-sm font-semibold tracking-[0.16em] text-main">SYSTEM STATUS</h3>
          </div>
          <span className={`text-xs font-semibold ${status === "Stable" ? "text-accent" : status === "Warning" ? "text-amber-300" : "text-red-400"}`}>
            {status.toUpperCase()}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted">
          Host: {system?.hostname || "loading"} · OS: {system?.os || "loading"} · Uptime: {uptimeHours}h
        </p>
      </section>

      <section className="overview-grid">
        <MetricCard icon={Cpu} title="CPU" value={`${cpu.toFixed(1)}%`} />
        <MetricCard icon={MemoryStick} title="MEMORY" value={`${memory.toFixed(1)}%`} />
        <MetricCard icon={HardDrive} title="DISK" value={`${disk.toFixed(1)}%`} />
        <MetricCard icon={Network} title="NETWORK" value={`${network.toFixed(1)} KB/s`} />
      </section>

      <section className="panel">
        <div className="flex items-center gap-2">
          <Server size={14} className="text-accent" />
          <h3 className="text-sm font-semibold tracking-[0.16em] text-main">LIVE GRAPH</h3>
        </div>
        <div className="mt-2 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={graphData}>
              <XAxis dataKey="t" tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Area type="monotone" dataKey="cpu" stroke="#00FF9C" fill="rgba(0,255,156,0.17)" strokeWidth={2} />
              <Area type="monotone" dataKey="memory" stroke="#00D084" fill="rgba(0,208,132,0.13)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="split-grid">
        <div className="panel">
          <div className="flex items-center gap-2">
            <Server size={14} className="text-accent" />
            <h3 className="text-sm font-semibold tracking-[0.16em] text-main">PROCESSES</h3>
          </div>
          <div className="mt-3 space-y-1 text-sm text-muted">
            <p>Total: {system?.processes?.total ?? 0}</p>
            <p>Running: {system?.processes?.running ?? 0}</p>
            <p>Blocked: {system?.processes?.blocked ?? 0}</p>
          </div>
        </div>
        <div className="panel">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-accent" />
            <h3 className="text-sm font-semibold tracking-[0.16em] text-main">ALERTS</h3>
          </div>
          <div className="mt-3 space-y-1 text-sm text-muted">
            <p>{status === "Stable" ? "No active alerts" : "Threshold exceeded. Review host metrics."}</p>
            <p>Last update: {system?.updatedAt ? new Date(system.updatedAt).toLocaleTimeString() : "n/a"}</p>
            {systemLoading && <p>Refreshing system telemetry...</p>}
            {systemError && <p className="text-red-400">{systemError}</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ icon: Icon, title, value }) {
  return (
    <div className="panel">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-[0.14em] text-muted">{title}</p>
        <Icon size={14} className="text-accent" />
      </div>
      <p className="mt-2 font-mono text-lg text-main">{value}</p>
    </div>
  );
}
