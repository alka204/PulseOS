const os = require("os");

/**
 * Approximate overall CPU usage by diffing `os.cpus()` times.
 * Short delay keeps the handler simple without background workers.
 */
function sampleCpuUsage() {
  return new Promise((resolve) => {
    const start = os.cpus();
    setTimeout(() => {
      const end = os.cpus();
      let idleDiff = 0;
      let totalDiff = 0;

      for (let i = 0; i < end.length; i++) {
        const s = start[i].times;
        const e = end[i].times;
        idleDiff += e.idle - s.idle;
        for (const key of Object.keys(e)) {
          totalDiff += e[key] - s[key];
        }
      }

      const usagePct =
        totalDiff === 0 ? 0 : Math.round(100 * (1 - idleDiff / totalDiff));
      resolve(Math.min(100, Math.max(0, usagePct)));
    }, 150);
  });
}

/**
 * System snapshot for the dashboard (memory + CPU estimate).
 */
async function getSystem(req, res) {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  const cpuUsagePercent = await sampleCpuUsage();

  res.json({
    cpu: {
      usagePercent: cpuUsagePercent,
      cores: os.cpus().length,
      model: os.cpus()[0]?.model || "unknown",
      loadAverage: os.loadavg(),
    },
    memory: {
      totalBytes: totalMem,
      freeBytes: freeMem,
      usedBytes: usedMem,
      totalGB: (totalMem / 1024 ** 3).toFixed(2),
      freeGB: (freeMem / 1024 ** 3).toFixed(2),
      usedGB: (usedMem / 1024 ** 3).toFixed(2),
    },
    hostname: os.hostname(),
    platform: os.platform(),
    uptimeSeconds: Math.floor(os.uptime()),
  });
}

module.exports = { getSystem, sampleCpuUsage };
