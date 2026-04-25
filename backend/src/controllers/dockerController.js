const os = require("os");
const Docker = require("dockerode");

function createDockerClient() {
  if (os.platform() === "win32") {
    return new Docker({ socketPath: "//./pipe/docker_engine" });
  }
  return new Docker({ socketPath: "/var/run/docker.sock" });
}

const docker = createDockerClient();

async function ensureDockerAvailable() {
  try {
    await docker.ping();
  } catch {
    const err = new Error("Docker daemon is not available");
    err.status = 503;
    throw err;
  }
}

function formatPorts(ports = []) {
  if (!ports.length) return "—";
  return ports
    .map((port) =>
      port.PublicPort
        ? `${port.PublicPort}:${port.PrivatePort}/${port.Type}`
        : `${port.PrivatePort}/${port.Type}`,
    )
    .join(", ");
}

function formatUptime(state) {
  const startedAt = state?.StartedAt
    ? new Date(state.StartedAt).getTime()
    : null;
  if (!startedAt || Number.isNaN(startedAt)) return "n/a";
  const totalSec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

async function listContainers(req, res) {
  await ensureDockerAvailable();
  const containers = await docker.listContainers({ all: true });
  const detailed = await Promise.all(
    containers.map(async (container) => {
      const inspected = await docker.getContainer(container.Id).inspect();
      return {
        id: container.Id,
        name: (container.Names?.[0] || "").replace(/^\//, ""),
        image: container.Image,
        status: container.Status,
        state: container.State,
        ports: formatPorts(container.Ports),
        uptime: formatUptime(inspected.State),
      };
    }),
  );
  res.json(detailed);
}

async function getContainer(req, res) {
  await ensureDockerAvailable();
  const container = docker.getContainer(req.params.id);
  const inspected = await container.inspect();
  res.json({
    id: inspected.Id,
    name: (inspected.Name || "").replace(/^\//, ""),
    image: inspected.Config?.Image || "",
    status: inspected.State?.Status || "",
    env: inspected.Config?.Env || [],
    mounts: inspected.Mounts || [],
    network: inspected.NetworkSettings?.Networks || {},
  });
}

async function getContainerLogs(req, res) {
  await ensureDockerAvailable();
  const container = docker.getContainer(req.params.id);
  const logsBuffer = await container.logs({
    stdout: true,
    stderr: true,
    tail: 100,
    timestamps: true,
  });
  res.json({
    id: req.params.id,
    logs: logsBuffer.toString("utf8"),
  });
}

async function startContainer(req, res) {
  await ensureDockerAvailable();
  const container = docker.getContainer(req.params.id);
  await container.start();
  res.json({ ok: true, action: "start", id: req.params.id });
}

async function stopContainer(req, res) {
  await ensureDockerAvailable();
  const container = docker.getContainer(req.params.id);
  await container.stop();
  res.json({ ok: true, action: "stop", id: req.params.id });
}

async function restartContainer(req, res) {
  await ensureDockerAvailable();
  const container = docker.getContainer(req.params.id);
  await container.restart();
  res.json({ ok: true, action: "restart", id: req.params.id });
}

module.exports = {
  listContainers,
  getContainer,
  getContainerLogs,
  startContainer,
  stopContainer,
  restartContainer,
};
