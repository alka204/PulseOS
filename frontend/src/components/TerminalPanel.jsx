import { useState } from "react";

export default function TerminalPanel() {
  const [input, setInput] = useState("");
  const [lines, setLines] = useState([
    "PulseOS Terminal v1.0",
    "Type ls, pwd, whoami, or date",
    "[AI] System nominal - all subsystems stable.",
  ]);

  function run() {
    const cmd = input.trim();
    if (!cmd) return;
    const prompt = `pulse@dashboard:~$ ${cmd}`;

    let output;
    switch (cmd.toLowerCase()) {
      case "ls":
        output = "components  logs  configs  modules";
        break;
      case "pwd":
        output = "/opt/pulseos/dashboard";
        break;
      case "whoami":
        output = "pulse-admin";
        break;
      case "date":
        output = new Date().toString();
        break;
      default:
        output = `Command not found: ${cmd}`;
    }

    const aiLine =
      Math.random() > 0.82
        ? "[AI] Anomaly detected - memory spike observed."
        : "[AI] System nominal - telemetry clean.";
    setLines((prev) => [...prev, prompt, output, aiLine]);
    setInput("");
  }

  return (
    <section className="glass-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-100">Pulse Terminal</h2>
        <p className="text-xs text-slate-400">Simulated command console with AI signals</p>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="Enter command..."
          className="flex-1 rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 font-mono text-sm text-slate-100 outline-none ring-accent/40 placeholder:text-slate-500 focus:border-accent/60 focus:ring-2"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={run}
          disabled={!input.trim()}
          className="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-[0_0_18px_var(--pulse-accent-glow)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Run
        </button>
      </div>
      <pre className="mt-4 max-h-72 overflow-auto rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-xs leading-relaxed text-emerald-100">
        {lines.join("\n")}
      </pre>
    </section>
  );
}
