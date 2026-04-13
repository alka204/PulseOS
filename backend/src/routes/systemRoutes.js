const { Router } = require("express");
const { getSystem } = require("../controllers/systemController");
const { asyncHandler } = require("../middleware/errorHandler");

const router = Router();

// Async handler wraps the promise-based controller
router.get("/", asyncHandler(getSystem));

module.exports = router;
