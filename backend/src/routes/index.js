const { Router } = require("express");
const healthRoutes = require("./healthRoutes");
const systemRoutes = require("./systemRoutes");
const commandRoutes = require("./commandRoutes");
const authRoutes = require("./authRoutes");
const dockerRoutes = require("./dockerRoutes");

const router = Router();

router.use("/health", healthRoutes);
router.use("/system", systemRoutes);
router.use("/command", commandRoutes);
router.use("/docker", dockerRoutes);
router.use("/", authRoutes);

module.exports = router;
