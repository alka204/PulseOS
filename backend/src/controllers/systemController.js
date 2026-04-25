const si = require("systeminformation");
const os = require("os");

function toGB(bytes) {
  return Number((bytes / 1024 ** 3).toFixed(2));
}

async function getSystemSnapshot() {
  const [load, mem, fs, time, battery, osInfo, cpuInfo, networkStats, processes, netIfaces] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.fsSize(),
    si.time(),
    si.battery().catch(() => null),
    si.osInfo(),
    si.cpu(),
    si.networkStats().catch(() => []),
    si.processes().catch(() => null),
    si.networkInterfaces().catch(() => []),
  ]);

  const rootDisk =
    fs.find((disk) => disk.mount === "/" || disk.mount === "C:") || fs[0] || null;
  const diskUsedPercent = rootDisk ? Number(rootDisk.use.toFixed(1)) : 0;

  const network = Array.isArray(networkStats) && networkStats.length > 0 ? networkStats[0] : null;
  const primaryIface =
    netIfaces.find((iface) => iface.default || (iface.ip4 && !iface.internal)) ||
    netIfaces.find((iface) => iface.ip4) ||
    netIfaces[0] ||
    null;
  const uptimeSeconds = os.uptime();
  const diskTotal = rootDisk ? rootDisk.size : 0;
  const diskUsed = rootDisk ? rootDisk.used : 0;
  const diskFree = Math.max(0, diskTotal - diskUsed);

  return {
    cpu: {
      usagePercent: Number(load.currentLoad.toFixed(1)),
      load: Number(load.currentLoad.toFixed(1)),
      cores: cpuInfo.cores || cpuInfo.physicalCores || 0,
      model: cpuInfo.brand || "unknown",
      speed: cpuInfo.speed ? Number(cpuInfo.speed) : 0,
    },
    memory: {
      totalGB: toGB(mem.total),
      usedGB: toGB(mem.used),
      freeGB: toGB(mem.available),
      swapGB: toGB(mem.swaptotal || 0),
      usedPercent: Number(((mem.used / mem.total) * 100).toFixed(1)),
      total: mem.total,
      used: mem.used,
      free: mem.available,
      swap: mem.swaptotal || 0,
    },
    disk: {
      totalGB: rootDisk ? toGB(rootDisk.size) : 0,
      usedGB: rootDisk ? toGB(rootDisk.used) : 0,
      freeGB: toGB(diskFree),
      usedPercent: diskUsedPercent,
      total: diskTotal,
      used: diskUsed,
      free: diskFree,
      type: rootDisk?.type || "unknown",
    },
    battery: {
      hasBattery: Boolean(battery?.hasBattery),
      percent: battery?.hasBattery ? Number((battery.percent ?? 0).toFixed(1)) : null,
      isCharging: Boolean(battery?.isCharging),
    },
    uptime: uptimeSeconds,
    hostname: os.hostname(),
    os: osInfo.platform,
    osVersion: `${osInfo.distro || osInfo.platform || "Unknown"} ${osInfo.release || ""}`.trim(),
    architecture: os.arch(),
    platform: osInfo.platform,
    network: {
      rxSecKB: network ? Number((network.rx_sec / 1024).toFixed(1)) : 0,
      txSecKB: network ? Number((network.tx_sec / 1024).toFixed(1)) : 0,
      ip: primaryIface?.ip4 || "",
      mac: primaryIface?.mac || "",
      interface: primaryIface?.iface || "",
    },
    processes: {
      total: processes?.all ?? 0,
      running: processes?.running ?? 0,
      blocked: processes?.blocked ?? 0,
    },
    environment: {
      nodeVersion: process.version,
      status: "Running",
    },
    updatedAt: new Date().toISOString(),
  };
}

async function getSystem(req, res) {
  const snapshot = await getSystemSnapshot();
  res.json(snapshot);
}

module.exports = { getSystem, getSystemSnapshot };
