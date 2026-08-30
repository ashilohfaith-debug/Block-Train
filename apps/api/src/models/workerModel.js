const pool = require("../db");

const WorkerModel = {
  async getAll() {
    const { rows } = await pool.query("SELECT * FROM workers ORDER BY id DESC");
    return rows;
  },
  async create({ name, phone, department }) {
    const { rows } = await pool.query(
      "INSERT INTO workers (name, phone, department) VALUES ($1, $2, $3) RETURNING *",
      [name, phone, department]
    );
    return rows[0];
  },
  async delete(id) {
    await pool.query("DELETE FROM workers WHERE id = $1", [id]);
  }
};

module.exports = WorkerModel;
