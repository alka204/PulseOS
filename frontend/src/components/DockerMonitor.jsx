import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../config";

export default function DockerMonitor() {
  const [containers, setContainers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [details, setDetails] = useState(null);
  const [logs, setLogs] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionBusy, setActionBusy] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchContainers() {
      try {
        const res = await fetch(`${API_BASE}/api/docker/containers`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load Docker containers");
        if (cancelled) return;
        setContainers(data);
        if (!selectedId && data[0]?.id) setSelectedId(data[0].id);
        if (selectedId && !data.some((c) => c.id === selectedId)) setSelectedId(data[0]?.id || "");
        setError("");
      } catch (err) {
        if (!cancelled) setError(err.message || "Docker unavailable");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchContainers();
    const timer = window.setInterval(fetchContainers, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setDetails(null);
      setLogs("");
      return;
    }
    let cancelled = false;

    async function fetchDetails() {
      try {
        const res = await fetch(`${API_BASE}/api/docker/container/${selectedId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load container details");
        if (!cancelled) setDetails(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load details");
      }
    }

    async function fetchLogs() {
      try {
        const res = await fetch(`${API_BASE}/api/docker/logs/${selectedId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load container logs");
        if (!cancelled) setLogs(data.logs || "");
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load logs");
      }
    }

    fetchDetails();
    fetchLogs();
    const timer = window.setInterval(fetchLogs, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selectedId]);

  const stats = useMemo(() => {
    const total = containers.length;
    const running = containers.filter((c) => c.state === "running").length;
    const stopped = total - running;
    return { total, running, stopped };
  }, [containers]);

  async function handleAction(action) {
    if (!selectedId) return;
    setActionBusy(action);
    try {
      const res = await fetch(`${API_BASE}/api/docker/${action}/${selectedId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action} container`);
      const refresh = await fetch(`${API_BASE}/api/docker/containers`);
      const refreshData = await refresh.json();
      if (refresh.ok) setContainers(refreshData);
      setError("");
    } catch (err) {
      setError(err.message || `Failed to ${action} container`);
    } finally {
      setActionBusy("");
    }
  }

  return (
    <div className="space-y-3 pt-2">
      <section className="panel">
        <h3 className="text-sm font-semibold tracking-[0.16em] text-main">DOCKER STATUS</h3>
        <div className="mt-2 flex flex-wrap items-center gap-5 text-sm">
          <p className="text-muted">
            Total containers: <span className="text-main">{stats.total}</span>
          </p>
          <p className="text-muted">
            Running: <span className="text-accent">{stats.running}</span>
          </p>
          <p className="text-muted">
            Stopped: <span className="text-red-400">{stats.stopped}</span>
          </p>
          <span className={`status-dot ${stats.running > 0 ? "status-dot-on" : "status-dot-off"}`} />
        </div>
      </section>

      <section className="panel">
        <h3 className="text-sm font-semibold tracking-[0.16em] text-main">CONTAINER LIST TABLE</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="docker-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Container ID</th>
                <th>Image</th>
                <th>Status</th>
                <th>Ports</th>
              </tr>
            </thead>
            <tbody>
              {containers.map((container) => (
                <tr
                  key={container.id}
                  onClick={() => setSelectedId(container.id)}
                  className={selectedId === container.id ? "docker-row-selected" : ""}
                >
                  <td>{container.name}</td>
                  <td className="font-mono">{container.id.slice(0, 12)}</td>
                  <td>{container.image}</td>
                  <td>
                    <span className={container.state === "running" ? "text-accent" : "text-red-400"}>
                      {container.state === "running" ? "Running" : "Stopped"}
                    </span>
                  </td>
                  <td>{container.ports}</td>
                </tr>
              ))}
              {!loading && containers.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    No containers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-[0.16em] text-main">SELECTED CONTAINER DETAILS</h3>
          <div className="flex gap-2">
            <button type="button" className="btn-accent" disabled={!selectedId || actionBusy} onClick={() => handleAction("start")}>
              {actionBusy === "start" ? "Starting..." : "Start"}
            </button>
            <button type="button" className="btn-muted" disabled={!selectedId || actionBusy} onClick={() => handleAction("stop")}>
              {actionBusy === "stop" ? "Stopping..." : "Stop"}
            </button>
            <button type="button" className="btn-muted" disabled={!selectedId || actionBusy} onClick={() => handleAction("restart")}>
              {actionBusy === "restart" ? "Restarting..." : "Restart"}
            </button>
          </div>
        </div>
        {details ? (
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            <InfoBlock
              title="Container"
              rows={[
                ["Name", details.name],
                ["Image", details.image],
                ["Status", details.status],
              ]}
            />
            <InfoBlock
              title="Network"
              rows={Object.entries(details.network || {}).map(([name, net]) => [name, net?.IPAddress || "n/a"])}
            />
            <InfoBlock title="Environment variables" rows={(details.env || []).slice(0, 12).map((env) => [env.split("=")[0], env])} />
            <InfoBlock
              title="Mounted volumes"
              rows={(details.mounts || []).map((mount) => [mount.Type || "mount", `${mount.Source || ""} -> ${mount.Destination || ""}`])}
            />
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">Select a container to inspect details.</p>
        )}
      </section>

      <section className="panel">
        <h3 className="text-sm font-semibold tracking-[0.16em] text-main">LOGS PANEL</h3>
        <pre className="docker-logs">{logs || "No logs available."}</pre>
      </section>

      {error && (
        <section className="panel">
          <p className="text-sm text-red-400">{error}</p>
        </section>
      )}
    </div>
  );
}

function InfoBlock({ title, rows }) {
  return (
    <div className="docker-info-block">
      <p className="mb-2 text-xs uppercase tracking-[0.12em] text-muted">{title}</p>
      <div className="space-y-1.5">
        {rows.length === 0 && <p className="text-sm text-muted">n/a</p>}
        {rows.map(([label, value]) => (
          <div key={`${title}-${label}-${value}`} className="flex justify-between gap-3 text-sm">
            <span className="text-muted">{label}</span>
            <span className="max-w-[65%] truncate font-mono text-main">{value || "n/a"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
