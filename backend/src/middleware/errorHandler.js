/**
 * Central Express error handler.
 * Catches errors passed via next(err) or thrown in async routes (when wrapped).
 */
function errorHandler(err, req, res, next) {
  // Default to 500 if status not set
  const status = err.status || err.statusCode || 500;
  const message =
    status === 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Something went wrong";

  console.error("[PulseOS]", err);

  res.status(status).json({
    ok: false,
    error: message,
  });
}

/** Wrap async route handlers so rejections reach errorHandler */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { errorHandler, asyncHandler };
