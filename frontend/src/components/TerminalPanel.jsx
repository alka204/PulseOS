import { useState } from "react";
import { API_BASE } from "../config";

/**
 * Simple in-browser terminal: sends shell commands to POST /api/command.
 */
export default function TerminalPanel() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function run() {
    const cmd = input.trim();
    if (!cmd) return;

    setBusy(true);
    setErr(null);
    setOutput("");

    try {
      const res = await fetch(`${API_BASE}/api/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || res.statusText || "Request failed");
      }

      const chunks = [];
      if (data.stdout) chunks.push(data.stdout);
      if (data.stderr) chunks.push(`[stderr]\n${data.stderr}`);
      if (!data.ok && !data.stdout && !data.stderr) {
        chunks.push("Command finished with no output.");
      }
      setOutput(chunks.join("\n").trim() || "(no output)");
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-700/60 bg-pulse-900/60 p-5 shadow-card backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-100">Remote terminal</h2>
        <p className="text-xs text-amber-200/80">
          Runs on the server — use only in trusted environments.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !busy && run()}
          placeholder="e.g. node -v   or   echo hello"
          className="flex-1 rounded-xl border border-slate-600 bg-pulse-950/80 px-4 py-2.5 font-mono text-sm text-slate-100 outline-none ring-cyan-400/40 placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-2"
          disabled={busy}
          spellCheck={false}
        />
        <button
          type="button"
          onClick={run}
          disabled={busy || !input.trim()}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-6 py-2.5 text-sm font-semibold text-pulse-950 shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Running…" : "Run"}
        </button>
      </div>

      {err && (
        <p className="mt-3 text-sm text-red-300" role="alert">
          {err}
        </p>
      )}

      <pre className="mt-4 max-h-64 overflow-auto rounded-xl border border-slate-800 bg-black/40 p-4 font-mono text-xs leading-relaxed text-emerald-100/90">
        {output || <span className="text-slate-600">Output appears here…</span>}
      </pre>
    </section>
  );
}
