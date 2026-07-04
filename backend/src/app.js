const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// --- Middleware ---
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://pulse-os-six.vercel.app",
    ],
    credentials: true,
  }),
);
app.use(express.json());

// --- Routes ---
app.use("/api", apiRoutes);

// 404 for unknown API paths
app.use("/api", (req, res) => {
  res.status(404).json({ ok: false, error: "Not found" });
});

// --- Errors ---
app.use(errorHandler);

module.exports = app;
