const crypto = require("crypto");
const users = require("../data/users.json");

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function buildToken(username, role) {
  const nonce = crypto.randomBytes(24).toString("hex");
  return `${username}.${role}.${nonce}`;
}

async function login(req, res) {
  const { username, password } = req.body || {};

  if (!username || !password) {
    const err = new Error("Username and password are required");
    err.status = 400;
    throw err;
  }

  const account = users.find((user) => user.username === username);
  const passwordHash = sha256(password);

  if (!account || account.password !== passwordHash) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  res.json({
    ok: true,
    token: buildToken(account.username, account.role),
    user: {
      username: account.username,
      role: account.role,
    },
  });
}

module.exports = { login };
