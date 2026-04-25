import { Battery, Cpu, HardDrive, MemoryStick, Monitor, Network, Server } from "lucide-react";

export default function HostDetails({ system, systemLoading, systemError }) {
  return (
    <div className="space-y-3 pt-2">
      <section className="panel">
        <div className="flex items-center gap-2">
          <Monitor size={14} className="text-accent" />
          <h3 className="text-sm font-semibold tracking-[0.16em] text-main">SYSTEM IDENTITY</h3>
        </div>
        <InfoGrid
          rows={[
            ["Hostname", system?.hostname || "Unknown"],
            ["OS", `${system?.os || "Unknown"} (${system?.osVersion || "n/a"})`],
            ["Architecture", system?.architecture || "Unknown"],
            ["Uptime", formatUptime(system?.uptime)],
          ]}
        />
      </section>

      <section className="host-grid">
        <DetailPanel
          icon={Cpu}
          title="CPU DETAILS"
          rows={[
            ["Model", system?.cpu?.model || "Unknown"],
            ["Cores", String(system?.cpu?.cores ?? 0)],
            ["Speed", `${system?.cpu?.speed ?? 0} GHz`],
            ["Load", `${system?.cpu?.load ?? 0}%`],
          ]}
        />
        <DetailPanel
          icon={MemoryStick}
          title="MEMORY DETAILS"
          rows={[
            ["Total RAM", `${toGB(system?.memory?.total)} GB`],
            ["Used RAM", `${toGB(system?.memory?.used)} GB`],
            ["Free RAM", `${toGB(system?.memory?.free)} GB`],
            ["Swap", `${toGB(system?.memory?.swap)} GB`],
          ]}
        />

        <DetailPanel
          icon={HardDrive}
          title="DISK DETAILS"
          rows={[
            ["Total Space", `${toGB(system?.disk?.total)} GB`],
            ["Used", `${toGB(system?.disk?.used)} GB`],
            ["Free", `${toGB(system?.disk?.free)} GB`],
            ["Type", system?.disk?.type || "Unknown"],
          ]}
        />
        <DetailPanel
          icon={Network}
          title="NETWORK INFO"
          rows={[
            ["IP Address", system?.network?.ip || "Unavailable"],
            ["MAC Address", system?.network?.mac || "Unavailable"],
            ["Interface", system?.network?.interface || "Unavailable"],
            ["Traffic", `${system?.network?.rxSecKB ?? 0}/${system?.network?.txSecKB ?? 0} KB/s`],
          ]}
        />

        <DetailPanel
          icon={Battery}
          title="BATTERY"
          rows={[
            ["Battery %", system?.battery?.hasBattery ? `${system?.battery?.percent ?? 0}%` : "No battery"],
            ["Charging", system?.battery?.isCharging ? "Yes" : "No"],
          ]}
        />
        <DetailPanel
          icon={Server}
          title="ENVIRONMENT"
          rows={[
            ["Node Version", system?.environment?.nodeVersion || "Unknown"],
            ["Status", system?.environment?.status || "Unknown"],
          ]}
        />
      </section>

      {(systemLoading || systemError) && (
        <section className="panel">
          {systemLoading && <p className="text-sm text-muted">Refreshing host details...</p>}
          {systemError && <p className="text-sm text-red-400">{systemError}</p>}
        </section>
      )}
    </div>
  );
}

function DetailPanel({ icon: Icon, title, rows }) {
  return (
    <div className="panel mt-0">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-accent" />
        <h3 className="text-sm font-semibold tracking-[0.16em] text-main">{title}</h3>
      </div>
      <InfoGrid rows={rows} />
    </div>
  );
}

function InfoGrid({ rows }) {
  return (
    <div className="mt-3 space-y-1.5">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted">{label}</span>
          <span className="font-mono text-main">{value}</span>
        </div>
      ))}
    </div>
  );
}

function toGB(value) {
  if (!value) return "0.00";
  return (Number(value) / 1024 ** 3).toFixed(2);
}

function formatUptime(totalSeconds) {
  if (!totalSeconds) return "n/a";
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}
