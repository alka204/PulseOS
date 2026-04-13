const { Server } = require("socket.io");
const os = require("os");
const { sampleCpuUsage } = require("./controllers/systemController");

let io;

/**
 * Builds a lightweight system payload for WebSocket broadcasts.
 */
async function buildSystemPayload() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const cpuUsagePercent = await sampleCpuUsage();

  return {
    cpu: {
      usagePercent: cpuUsagePercent,
      cores: os.cpus().length,
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
    uptimeSeconds: Math.floor(os.uptime()),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Attach Socket.io to the HTTP server and push periodic system stats.
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      methods: ["GET", "POST"],
    },
  });

  // One broadcast timer for all clients (avoids duplicate work per connection)
  setInterval(async () => {
    try {
      if (!io) return;
      io.emit("system:update", await buildSystemPayload());
    } catch (e) {
      io?.emit("system:error", { message: e.message });
    }
  }, 3000);

  io.on("connection", async (socket) => {
    console.log("[Socket.io] Client connected:", socket.id);
    try {
      socket.emit("system:update", await buildSystemPayload());
    } catch (e) {
      socket.emit("system:error", { message: e.message });
    }

    socket.on("disconnect", () => {
      console.log("[Socket.io] Client disconnected:", socket.id);
    });
  });

  return io;
}

module.exports = { initSocket };
