import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { API_BASE, getSocketOrigin } from "./config";
import SystemPanel from "./components/SystemPanel.jsx";
import TerminalPanel from "./components/TerminalPanel.jsx";

/** Merge REST snapshot with slimmer live socket payloads */
function mergeSystem(rest, live) {
  if (!rest && !live) return null;
  if (!live) return rest;
  if (!rest) return live;
  return {
    ...rest,
    ...live,
    cpu: { ...rest.cpu, ...live.cpu },
    memory: { ...rest.memory, ...live.memory },
  };
}

/**
 * Root dashboard: health + system metrics + optional Socket.io live updates.
 */
export default function App() {
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState(null);

  const [system, setSystem] = useState(null);
  const [systemLoading, setSystemLoading] = useState(true);
  const [systemError, setSystemError] = useState(null);

  const [liveSystem, setLiveSystem] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastSocketUpdate, setLastSocketUpdate] = useState(null);

  const displaySystem = mergeSystem(system, liveSystem);
  const systemBusy = systemLoading && !displaySystem;

  // --- Initial REST fetch (health + system) ---
  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      setHealthLoading(true);
      setHealthError(null);
      try {
        const res = await fetch(`${API_BASE}/api/health`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || res.statusText);
        if (!cancelled) setHealth(data.message ?? JSON.stringify(data));
      } catch (e) {
        if (!cancelled) setHealthError(e.message || String(e));
      } finally {
        if (!cancelled) setHealthLoading(false);
      }
    }

    async function loadSystem() {
      setSystemLoading(true);
      setSystemError(null);
      try {
        const res = await fetch(`${API_BASE}/api/system`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || res.statusText);
        if (!cancelled) setSystem(data);
      } catch (e) {
        if (!cancelled) setSystemError(e.message || String(e));
      } finally {
        if (!cancelled) setSystemLoading(false);
      }
    }

    loadHealth();
    loadSystem();

    return () => {
      cancelled = true;
    };
  }, []);

  // --- Socket.io live metrics ---
  useEffect(() => {
    const origin = getSocketOrigin();
    const socket = io(origin, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));

    socket.on("system:update", (payload) => {
      setLiveSystem(payload);
      setLastSocketUpdate(payload.updatedAt || new Date().toISOString());
    });

    socket.on("system:error", (p) => {
      console.warn("Socket system error:", p);
    });

    return () => socket.close();
  }, []);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <header className="text-center">
       
        <h1 className="mt-2 bg-gradient-to-r from-white via-cyan-100 to-sky-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
          PulseOS
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
          Monitor host health, memory, and CPU
        </p>
      </header>

      {/* Health strip */}
      <section className="mx-auto mt-10 w-full max-w-3xl">
        <div className="rounded-2xl border border-slate-700/60 bg-pulse-900/50 px-5 py-4 text-center shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">API health</p>
          {healthLoading && <p className="mt-2 text-slate-400">Checking backend…</p>}
          {healthError && (
            <p className="mt-2 text-sm text-red-300">
              {healthError}{" "}
              <span className="block text-xs text-slate-500">
                Start the backend: <code className="text-cyan-300">cd backend && npm start</code>
              </span>
            </p>
          )}
          {!healthLoading && !healthError && (
            <p className="mt-2 font-mono text-lg text-emerald-300">{health}</p>
          )}
        </div>
      </section>

      {/* Live badge */}
      <div className="mx-auto mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
        <span
          className={`inline-flex h-2 w-2 rounded-full ${
            socketConnected ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-slate-600"
          }`}
        />
        Socket.io: {socketConnected ? "connected" : "disconnected"}
      </div>

      {/* System metrics */}
      <section className="mt-8">
        <SystemPanel
          system={displaySystem}
          loading={systemBusy}
          error={systemError}
          live={Boolean(liveSystem && socketConnected)}
          lastUpdate={lastSocketUpdate}
        />
      </section>

      {/* Terminal */}
      <section className="mt-10">
        <TerminalPanel />
      </section>

      <footer className="mt-12 text-center text-xs text-slate-600">
        REST base: {API_BASE || "(Vite proxy → :5000)"} · Backend default{" "}
        <code className="text-slate-500">http://localhost:5000</code>
      </footer>
    </div>
  );
}
