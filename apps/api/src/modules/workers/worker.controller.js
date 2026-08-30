const WorkerService = require('./worker.service');

const WorkerController = {
  /**
   * @route   GET /api/workers
   * @desc    Fetch all workers in the directory
   * @access  Public
   */
  async getAll(req, res) {
    try {
      const workers = await WorkerService.fetchAllWorkers();
      res.json({ workers });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch workers" });
    }
  },

  /**
   * @route   POST /api/workers
   * @desc    Add a new worker
   * @access  Public
   */
  async create(req, res) {
    try {
      const worker = await WorkerService.addWorker(req.body);
      res.json({ success: true, worker });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to add worker" });
    }
  },

  /**
   * @route   DELETE /api/workers/:id
   * @desc    Remove a worker
   * @access  Public
   */
  async delete(req, res) {
    try {
      await WorkerService.removeWorker(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete worker" });
    }
  }
};

module.exports = WorkerController;
