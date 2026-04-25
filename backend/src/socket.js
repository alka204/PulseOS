const { Server } = require("socket.io");
const { getSystemSnapshot } = require("./controllers/systemController");

let io;

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
      io.emit("system:update", await getSystemSnapshot());
    } catch (e) {
      io?.emit("system:error", { message: e.message });
    }
  }, 2000);

  io.on("connection", async (socket) => {
    console.log("[Socket.io] Client connected:", socket.id);
    try {
      socket.emit("system:update", await getSystemSnapshot());
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
