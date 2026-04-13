/**
 * Health check — confirms the API process is running.
 */
function getHealth(req, res) {
  res.json({ message: "PulseOS Backend Running" });
}

module.exports = { getHealth };
