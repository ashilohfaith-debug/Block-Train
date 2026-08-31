const ActiveBlockModel = require('./block.model');

const ActiveBlockService = {
  async fetchActiveBlocks() {
    const activeBlocks = await ActiveBlockModel.getAll();
    return activeBlocks.map(row => ({
      id: row.id,
      department: row.department,
      date: row.block_date,
      fromTime: row.from_time,
      toTime: row.to_time,
      urgency: row.urgency || 'Critical'
    }));
  },

  async addBlock(data) {
    if (!data.id || !data.department || !data.date || !data.fromTime || !data.toTime) {
      throw new Error("Missing required fields");
    }
    // Set default urgency if not provided
    if (!data.urgency) {
      data.urgency = 'Critical';
    }
    return await ActiveBlockModel.create(data);
  },

  async removeBlock(id) {
    await ActiveBlockModel.delete(id);
  }
};

module.exports = ActiveBlockService;
