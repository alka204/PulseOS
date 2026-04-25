const { Router } = require("express");
const { login } = require("../controllers/authController");
const { asyncHandler } = require("../middleware/errorHandler");

const router = Router();

router.post("/login", asyncHandler(login));

module.exports = router;
