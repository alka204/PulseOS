const { Router } = require("express");
const healthRoutes = require("./healthRoutes");
const systemRoutes = require("./systemRoutes");
const commandRoutes = require("./commandRoutes");

const router = Router();

router.use("/health", healthRoutes);
router.use("/system", systemRoutes);
router.use("/command", commandRoutes);

module.exports = router;
