const ActiveBlockService = require("../services/activeBlockService");

const ActiveBlockController = {
  /**
   * @route   GET /api/active_blocks
   * @desc    Fetch all active blocks
   * @access  Public
   */
  async getAll(req, res, next) {
    try {
      const blocks = await ActiveBlockService.fetchActiveBlocks();
      res.json({ success: true, blocks });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   POST /api/active_blocks
   * @desc    Create a new active block
   * @access  Public
   */
  async create(req, res, next) {
    try {
      const block = await ActiveBlockService.addBlock(req.body);
      res.json({ success: true, block });
    } catch (error) {
      if (error.message === "Missing required fields") {
        return res.status(400).json({ success: false, message: error.message });
      }
      if (error.code === '23505') {
        return res.json({ success: true, message: "Block already exists" });
      }
      next(error);
    }
  },

  /**
   * @route   DELETE /api/active_blocks/:id
   * @desc    Delete an active block
   * @access  Public
   */
  async delete(req, res, next) {
    try {
      await ActiveBlockService.removeBlock(req.params.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = ActiveBlockController;
