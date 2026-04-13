const { Router } = require("express");
const { runCommand } = require("../controllers/commandController");
const { asyncHandler } = require("../middleware/errorHandler");

const router = Router();

router.post("/", asyncHandler(runCommand));

module.exports = router;
