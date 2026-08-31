const bcrypt = require('bcryptjs');
const pool = require('./src/core/db');

(async () => {
  const hash = await bcrypt.hash('123', 12);
  try {
    await pool.query(`INSERT INTO users (name, email, password_hash, role, department) VALUES ('Admin', 'admin', $1, 'ADMIN', 'TRACK') ON CONFLICT (email) DO NOTHING`, [hash]);
    console.log('User created');
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
})();
