import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const TERMINAL_COMMANDS = ["ls", "pwd", "whoami", "date", "help", "clear"];

export function isTerminalCommand(text) {
  return TERMINAL_COMMANDS.includes(text.trim().toLowerCase());
}

export default function TerminalPanel({ initialCommand, onClose }) {
  const [input, setInput] = useState("");
  const [lines, setLines] = useState([
    "PulseOS Terminal v1.0",
    'Type ls, pwd, whoami, date, help, or clear',
    "[AI] System nominal - all subsystems stable.",
  ]);
  const preRef = useRef(null);
  const inputRef = useRef(null);

  function execute(cmd) {
    if (!cmd) return;
    const prompt = `pulse@dashboard:~$ ${cmd}`;

    if (cmd.toLowerCase() === "clear") {
      setLines(["PulseOS Terminal v1.0", "[AI] Console cleared."]);
      return;
    }

    if (cmd.toLowerCase() === "help") {
      setLines((prev) => [
        ...prev,
        prompt,
        "Available commands: ls, pwd, whoami, date, help, clear",
      ]);
      return;
    }

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
  }

  function run() {
    const cmd = input.trim();
    if (!cmd) return;
    execute(cmd);
    setInput("");
  }

  // Auto-execute an initial command passed from the search bar
  const processedRef = useRef(null);
  useEffect(() => {
    if (initialCommand && initialCommand !== processedRef.current) {
      processedRef.current = initialCommand;
      execute(initialCommand);
    }
  }, [initialCommand]);

  // Auto-scroll output to bottom
  useEffect(() => {
    if (preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight;
    }
  }, [lines]);

  // Auto-focus input when panel opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <section className="panel terminal-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-red-500/80" />
            <span className="inline-block h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="inline-block h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <h2 className="text-sm font-semibold tracking-[0.14em] text-main">
            PULSE TERMINAL
          </h2>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition hover:bg-white/10 hover:text-main"
            aria-label="Close terminal"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <pre
        ref={preRef}
        className="mt-3 max-h-56 overflow-auto rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-xs leading-relaxed text-emerald-200"
      >
        {lines.join("\n")}
      </pre>

      <div className="mt-3 flex gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-3">
          <span className="font-mono text-xs text-accent">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="Enter command..."
            className="flex-1 bg-transparent py-2.5 font-mono text-sm text-slate-100 outline-none placeholder:text-slate-500"
            spellCheck={false}
          />
        </div>
        <button
          type="button"
          onClick={run}
          disabled={!input.trim()}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Run
        </button>
      </div>
    </section>
  );
}

