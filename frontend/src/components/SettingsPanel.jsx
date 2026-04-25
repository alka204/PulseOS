import { useEffect, useState } from "react";

const STORAGE_KEY = "pulse-thresholds";
const ALERTS_KEY = "pulse-alert-channels";

export default function SettingsPanel({ initialValues, onApply }) {
  const [cpu, setCpu] = useState(initialValues.cpu);
  const [memory, setMemory] = useState(initialValues.memory);
  const [disk, setDisk] = useState(initialValues.disk);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [slackAlerts, setSlackAlerts] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const channels = JSON.parse(localStorage.getItem(ALERTS_KEY) || "{}");
    setEmailAlerts(Boolean(channels.email));
    setSlackAlerts(Boolean(channels.slack));
  }, []);

  function applyChanges() {
    const values = { cpu, memory, disk };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    localStorage.setItem(
      ALERTS_KEY,
      JSON.stringify({
        email: emailAlerts,
        slack: slackAlerts,
      })
    );
    onApply(values);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <section className="glass-card p-5">
      <h2 className="text-lg font-semibold text-white">Alert Settings</h2>
      <p className="mb-5 text-xs text-slate-400">Configure thresholds and notification channels</p>

      <div className="space-y-4">
        <Slider label="CPU Threshold" value={cpu} setValue={setCpu} />
        <Slider label="Memory Threshold" value={memory} setValue={setMemory} />
        <Slider label="Disk Threshold" value={disk} setValue={setDisk} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Toggle label="Email Alerts" checked={emailAlerts} onChange={setEmailAlerts} />
        <Toggle label="Slack Alerts" checked={slackAlerts} onChange={setSlackAlerts} />
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={applyChanges}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-black shadow-lg shadow-[0_0_16px_var(--pulse-accent-glow)] transition hover:brightness-110"
        >
          Apply Changes
        </button>
        {saved && <span className="text-xs text-emerald-300">Saved to localStorage</span>}
      </div>
    </section>
  );
}

function Slider({ label, value, setValue }) {
  return (
    <label className="block text-sm text-slate-300">
      <div className="mb-2 flex items-center justify-between">
        <span>{label}</span>
        <span className="font-mono text-accent">{value}%</span>
      </div>
      <input
        type="range"
        min="40"
        max="98"
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
        className="w-full accent-[var(--pulse-accent)]"
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition ${
        checked ? "border-accent bg-accent/15 text-accent" : "border-white/15 text-slate-300 hover:border-white/40"
      }`}
    >
      {label}
      <span className="text-xs">{checked ? "On" : "Off"}</span>
    </button>
  );
}
