const pool = require("../db");

const ActiveBlockModel = {
  async getAll() {
    const { rows } = await pool.query("SELECT * FROM active_blocks ORDER BY created_at DESC");
    return rows;
  },

  async create({ id, department, date, fromTime, toTime }) {
    const { rows } = await pool.query(
      "INSERT INTO active_blocks (id, department, block_date, from_time, to_time) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [id, department, date, fromTime, toTime]
    );
    return rows[0];
  },

  async delete(id) {
    await pool.query("DELETE FROM active_blocks WHERE id = $1", [id]);
  }
};

module.exports = ActiveBlockModel;
