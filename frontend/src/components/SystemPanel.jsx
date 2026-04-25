import { Battery, Cpu, HardDrive, MemoryStick } from "lucide-react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export default function SystemPanel({ system, loading, error, thresholds }) {
  if (loading && !system) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
        <p className="text-slate-300">Collecting live system telemetry...</p>
      </div>
    );
  }

  if (error && !system) {
    return <div className="glass-card border-rose-500/40 p-5 text-rose-200">{error}</div>;
  }

  if (!system) return null;

  const cpu = Number(system.cpu?.usagePercent || 0);
  const memory = Number(system.memory?.usedPercent || 0);
  const disk = Number(system.disk?.usedPercent || 0);
  const batteryValue =
    system.battery?.hasBattery && typeof system.battery?.percent === "number"
      ? Number(system.battery.percent)
      : 100;
  const batteryLabel = system.battery?.hasBattery ? `${batteryValue.toFixed(1)}%` : "N/A";

  const status = getStatus(cpu, memory, disk, thresholds);
  const bars = [
    { name: "CPU", value: cpu, threshold: thresholds.cpu },
    { name: "Memory", value: memory, threshold: thresholds.memory },
    { name: "Disk", value: disk, threshold: thresholds.disk },
    { name: "Battery", value: batteryValue, threshold: 20 },
  ];

  return (
    <section className="space-y-4">
      <div className="glass-card flex items-center justify-between p-4">
        <div>
          <h2 className="text-lg font-semibold text-white">System Monitor</h2>
          <p className="text-xs text-slate-400">Updated {new Date(system.updatedAt || Date.now()).toLocaleTimeString()}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            status === "Stable"
              ? "bg-emerald-500/20 text-emerald-300"
              : status === "Warning"
                ? "bg-amber-500/20 text-amber-300"
                : "bg-rose-500/20 text-rose-300"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Cpu} label="CPU" value={`${cpu.toFixed(1)}%`} detail={`Threshold ${thresholds.cpu}%`} />
        <MetricCard
          icon={MemoryStick}
          label="Memory"
          value={`${system.memory?.usedGB ?? 0}GB / ${system.memory?.totalGB ?? 0}GB`}
          detail={`${memory.toFixed(1)}% used`}
        />
        <MetricCard
          icon={HardDrive}
          label="Disk"
          value={`${system.disk?.usedGB ?? 0}GB / ${system.disk?.totalGB ?? 0}GB`}
          detail={`${disk.toFixed(1)}% used`}
        />
        <MetricCard icon={Battery} label="Battery" value={batteryLabel} detail={system.battery?.isCharging ? "Charging" : "Discharging"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card h-64 p-4">
          <p className="mb-3 text-sm font-medium text-slate-300">Resource Utilization</p>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={bars}>
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {bars.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={
                      entry.name === "Battery"
                        ? "var(--pulse-accent)"
                        : entry.value >= entry.threshold
                          ? "#fb7185"
                          : "var(--pulse-accent)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card h-64 p-4">
          <p className="mb-3 text-sm font-medium text-slate-300">Load Distribution</p>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={[
                  { name: "CPU", value: cpu },
                  { name: "Memory", value: memory },
                  { name: "Disk", value: disk },
                ]}
                dataKey="value"
                nameKey="name"
                outerRadius={85}
              >
                <Cell fill="var(--pulse-accent)" />
                <Cell fill="#60a5fa" />
                <Cell fill="#a78bfa" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="glass-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
        <Icon size={16} className="text-accent" />
      </div>
      <p className="font-mono text-lg text-white">{value}</p>
      <p className="text-xs text-slate-400">{detail}</p>
    </div>
  );
}

function getStatus(cpu, memory, disk, thresholds) {
  if (cpu >= thresholds.cpu + 10 || memory >= thresholds.memory + 10 || disk >= thresholds.disk + 10) {
    return "Critical";
  }
  if (cpu >= thresholds.cpu || memory >= thresholds.memory || disk >= thresholds.disk) {
    return "Warning";
  }
  return "Stable";
}
