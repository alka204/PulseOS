const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

// Safety: avoid runaway commands (tune as needed)
const EXEC_TIMEOUT_MS = 30_000;
const MAX_BUFFER = 1024 * 1024; // 1 MB combined stdout+stderr

/**
 * Runs a shell command on the server.
 * WARNING: Only use in trusted environments; this is inherently powerful.
 */
async function runCommand(req, res, next) {
  try {
    const { command } = req.body;

    if (typeof command !== "string" || !command.trim()) {
      const err = new Error('Body must include a non-empty string "command"');
      err.status = 400;
      throw err;
    }

    const trimmed = command.trim();

    const { stdout, stderr } = await execAsync(trimmed, {
      timeout: EXEC_TIMEOUT_MS,
      maxBuffer: MAX_BUFFER,
      windowsHide: true,
    });

    res.json({
      ok: true,
      command: trimmed,
      stdout: stdout || "",
      stderr: stderr || "",
    });
  } catch (err) {
    // exec errors include stdout/stderr on the error object sometimes
    if (err.killed && err.signal === "SIGTERM") {
      const timeoutErr = new Error("Command timed out");
      timeoutErr.status = 408;
      return next(timeoutErr);
    }

    const out = {
      ok: false,
      command: req.body?.command,
      stdout: err.stdout || "",
      stderr: err.stderr || err.message || String(err),
    };
    // Still 200 so the UI can show output; optional: use 500 for hard failures
    res.status(200).json(out);
  }
}

module.exports = { runCommand };
