require("dotenv").config();

// Refuse to start with a forgeable or missing signing key.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 random characters.");
}

const app = require("./app");
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});