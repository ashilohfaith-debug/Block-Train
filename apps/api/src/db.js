const { Pool } = require("pg");

// Strip ?sslmode=require from the string to prevent the annoying pg warning,
// since we manually pass ssl: { rejectUnauthorized: false } below.
const dbUrl = (process.env.DATABASE_URL || "").replace(/\?sslmode=require$/, "");

const pool = new Pool({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;