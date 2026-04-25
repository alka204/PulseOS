const { Router } = require("express");
const {
  listContainers,
  getContainer,
  getContainerLogs,
  startContainer,
  stopContainer,
  restartContainer,
} = require("../controllers/dockerController");
const { asyncHandler } = require("../middleware/errorHandler");

const router = Router();

router.get("/containers", asyncHandler(listContainers));
router.get("/container/:id", asyncHandler(getContainer));
router.get("/logs/:id", asyncHandler(getContainerLogs));
router.post("/start/:id", asyncHandler(startContainer));
router.post("/stop/:id", asyncHandler(stopContainer));
router.post("/restart/:id", asyncHandler(restartContainer));

module.exports = router;
