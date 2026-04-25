import { useEffect, useMemo, useState } from "react";
import { Activity, Box, ChevronDown, Cpu, Search, Settings, SlidersHorizontal, UserCircle2 } from "lucide-react";
import { Link, Navigate, NavLink, Outlet, Route, Routes, useOutletContext } from "react-router-dom";
import { API_BASE } from "./config";
import Login from "./components/Login.jsx";
import Overview from "./components/Overview.jsx";
import HostDetails from "./components/HostDetails.jsx";
import DockerMonitor from "./components/DockerMonitor.jsx";

const TOKEN_KEY = "pulse-token";
const USER_KEY = "pulse-user";

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  function handleAuthenticated(nextToken, nextUser) {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={token ? <Navigate to="/" replace /> : <Login onAuthenticated={handleAuthenticated} />}
      />
      <Route element={<ProtectedRoute token={token} />}>
        <Route path="/" element={<DashboardLayout onLogout={logout} user={user} />}>
          <Route index element={<OverviewPage />} />
          <Route path="host" element={<HostDetailsPage />} />
          <Route path="docker" element={<DockerMonitorPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
    </Routes>
  );
}

function SectionTitle({ title, icon: Icon }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} className="text-accent" />
      <h3 className="text-sm font-semibold tracking-[0.16em] text-main">{title}</h3>
    </div>
  );
}

function ProtectedRoute({ token }) {
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function DashboardLayout({ onLogout, user }) {
  const [system, setSystem] = useState(null);
  const [systemLoading, setSystemLoading] = useState(false);
  const [systemError, setSystemError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState("2s");
  const [channels, setChannels] = useState({ email: true, slack: false, discord: false });
  const [thresholds, setThresholds] = useState({ cpu: 80, memory: 80, disk: 85 });
  const [themeMode, setThemeMode] = useState("green");
  const [savedState, setSavedState] = useState(() =>
    JSON.stringify({
      thresholds: { cpu: 80, memory: 80, disk: 85 },
      channels: { email: true, slack: false, discord: false },
      refreshInterval: "2s",
      themeMode: "green",
    })
  );

  useEffect(() => {
    const persisted = localStorage.getItem("pulse-dashboard-config");
    if (!persisted) return;
    try {
      const parsed = JSON.parse(persisted);
      setThresholds(parsed.thresholds);
      setChannels(parsed.channels);
      setRefreshInterval(parsed.refreshInterval);
      setThemeMode(parsed.themeMode);
      setSavedState(persisted);
    } catch {
      // Ignore malformed persisted UI configuration.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer;
    let firstLoad = true;

    async function fetchSystem() {
      if (!cancelled && firstLoad) setSystemLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/system`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch system data");
        if (!cancelled) {
          setSystem(data);
          setSystemError(null);
        }
      } catch (error) {
        if (!cancelled) setSystemError(error.message || String(error));
      } finally {
        if (!cancelled) {
          setSystemLoading(false);
          firstLoad = false;
        }
      }
    }

    fetchSystem();
    timer = window.setInterval(fetchSystem, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const navItems = [
    { to: "/", label: "Overview", icon: Activity },
    { to: "/host", label: "Host Details", icon: Cpu },
    { to: "/docker", label: "Docker Monitor", icon: Box },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  const isStable =
    (system?.cpu?.usagePercent ?? 0) < thresholds.cpu &&
    (system?.memory?.usedPercent ?? 0) < thresholds.memory &&
    (system?.disk?.usedPercent ?? 0) < thresholds.disk;
  const status = isStable ? "Stable" : (system?.cpu?.usagePercent ?? 0) > thresholds.cpu + 10 ? "Critical" : "Warning";

  const hasUnsavedChanges = useMemo(() => {
    const current = JSON.stringify({ thresholds, channels, refreshInterval, themeMode });
    return current !== savedState;
  }, [channels, refreshInterval, savedState, themeMode, thresholds]);

  function applyChanges() {
    const nextSaved = JSON.stringify({ thresholds, channels, refreshInterval, themeMode });
    setSavedState(nextSaved);
    localStorage.setItem("pulse-dashboard-config", nextSaved);
  }

  function discardChanges() {
    const parsed = JSON.parse(savedState);
    setThresholds(parsed.thresholds);
    setChannels(parsed.channels);
    setRefreshInterval(parsed.refreshInterval);
    setThemeMode(parsed.themeMode);
  }

  const shared = {
    system,
    systemLoading,
    systemError,
    status,
    thresholds,
    channels,
    refreshInterval,
    themeMode,
    setRefreshInterval,
    setThemeMode,
    setThresholds,
    setChannels,
  };

  return (
    <div className="min-h-screen bg-shell text-main">
      <aside className="fixed left-0 top-0 flex h-screen w-[260px] flex-col border-r border-white/10 bg-sidebar">
        <div className="border-b border-white/10 px-5 py-5">
          <Link to="/" className="text-xl font-semibold tracking-wide text-main">
            PulseOS
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) => `menu-item ${isActive ? "menu-item-active" : ""}`}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
        <div className="border-t border-white/10 px-4 py-4">
          <div className="user-chip">
            <UserCircle2 size={16} className="text-accent" />
            <div className="flex-1">
              <p className="text-xs text-main">Admin</p>
              <p className="text-[11px] text-muted">{user?.username || "admin"}</p>
            </div>
            <button type="button" className="logout-link" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="ml-[260px] min-h-screen px-6 pb-24 pt-4">
        <header className="topbar">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">System Name</p>
            <h2 className="text-lg font-medium text-main">{system?.hostname || "Loading host..."}</h2>
          </div>
          <p className={`text-xs font-semibold tracking-wide ${isStable ? "text-accent" : "text-red-400"}`}>
            {isStable ? "SYSTEM STABLE" : "SYSTEM WARNING"}
          </p>
          <div className="search-wrap">
            <Search size={14} className="text-muted" />
            <input className="search-input" placeholder="Search commands or settings" />
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-muted">
              EXPORT LOGS
            </button>
            <button type="button" className="btn-accent" onClick={applyChanges}>
              APPLY CHANGES
            </button>
          </div>
        </header>

        <Outlet context={shared} />
      </main>

      {hasUnsavedChanges && (
        <div className="alert-bar">
          <p className="text-xs font-semibold tracking-wide text-red-100">UNSAVED CHANGES DETECTED</p>
          <div className="flex items-center gap-2">
            <button type="button" className="alert-btn" onClick={discardChanges}>
              Discard
            </button>
            <button type="button" className="alert-btn alert-btn-strong" onClick={applyChanges}>
              Apply Force
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewPage() {
  const { system, systemLoading, systemError, status } = useOutletContext();
  return (
    <Overview system={system} systemLoading={systemLoading} systemError={systemError} status={status} />
  );
}

function HostDetailsPage() {
  const { system, systemLoading, systemError } = useOutletContext();
  return (
    <HostDetails system={system} systemLoading={systemLoading} systemError={systemError} />
  );
}

function DockerMonitorPage() {
  return <DockerMonitor />;
}

function SettingsPage() {
  const [apiKey] = useState("pk_live_********************************");
  const {
    system,
    systemLoading,
    systemError,
    thresholds,
    channels,
    refreshInterval,
    themeMode,
    setRefreshInterval,
    setThemeMode,
    setThresholds,
    setChannels,
  } = useOutletContext();

  function updateThreshold(key, value) {
    setThresholds((prev) => ({ ...prev, [key]: Number(value) }));
  }

  function toggleChannel(key) {
    setChannels((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <>
      <section className="panel">
        <SectionTitle title="SYSTEM CONFIGURATION" icon={SlidersHorizontal} />
        <p className="mt-2 text-sm text-muted">
          Environment: {system?.os || system?.platform || "unknown"} · Host: {system?.hostname || "unavailable"} · Uptime:{" "}
          {system?.uptime ? `${Math.floor(system.uptime / 3600)}h` : "n/a"}
        </p>
        {systemLoading && <p className="mt-2 text-xs text-muted">Loading host telemetry...</p>}
        {systemError && <p className="mt-2 text-xs text-red-400">{systemError}</p>}
      </section>

      <section className="panel">
        <SectionTitle title="ALERT THRESHOLDS" icon={Cpu} />
        <div className="mt-3 space-y-3">
          <SliderRow label="CPU Usage %" value={thresholds.cpu} onChange={(v) => updateThreshold("cpu", v)} />
          <SliderRow label="Memory Usage %" value={thresholds.memory} onChange={(v) => updateThreshold("memory", v)} />
          <SliderRow label="Disk Space %" value={thresholds.disk} onChange={(v) => updateThreshold("disk", v)} />
        </div>
      </section>

      <section className="panel">
        <SectionTitle title="CHANNELS" icon={Activity} />
        <div className="mt-3 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
          <SwitchRow label="Email" checked={channels.email} onToggle={() => toggleChannel("email")} />
          <SwitchRow label="Slack" checked={channels.slack} onToggle={() => toggleChannel("slack")} />
          <SwitchRow label="Discord" checked={channels.discord} onToggle={() => toggleChannel("discord")} />
        </div>
      </section>

      <section className="panel">
        <SectionTitle title="API ACCESS" icon={Settings} />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input value={apiKey} readOnly className="api-input" />
          <button type="button" className="btn-muted">
            Generate New
          </button>
          <button type="button" className="btn-danger">
            Revoke All
          </button>
        </div>
      </section>

      <section className="panel">
        <SectionTitle title="SYSTEM PREFERENCES" icon={Settings} />
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted">Data Refresh Interval</p>
            <label className="select-wrap">
              <span>{refreshInterval}</span>
              <ChevronDown size={14} className="text-muted" />
              <select value={refreshInterval} onChange={(e) => setRefreshInterval(e.target.value)} className="native-select">
                <option value="1s">1s</option>
                <option value="2s">2s</option>
                <option value="5s">5s</option>
                <option value="10s">10s</option>
              </select>
            </label>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted">Theme Options</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setThemeMode("green")}
                className={`theme-pill ${themeMode === "green" ? "theme-pill-active" : ""}`}
              >
                Pulse Green
              </button>
              <button
                type="button"
                onClick={() => setThemeMode("red")}
                className={`theme-pill ${themeMode === "red" ? "theme-pill-red" : ""}`}
              >
                Pulse Red
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function SliderRow({ label, value, onChange }) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-main">{label}</span>
        <span className="font-mono text-accent">{value}%</span>
      </div>
      <input type="range" min="40" max="98" value={value} onChange={(e) => onChange(e.target.value)} className="pulse-slider" />
    </label>
  );
}

function SwitchRow({ label, checked, onToggle }) {
  return (
    <div className="switch-row">
      <span className="text-sm text-main">{label}</span>
      <button type="button" className={`switch ${checked ? "switch-on" : ""}`} onClick={onToggle} aria-label={label}>
        <span className="switch-thumb" />
      </button>
    </div>
  );
}
