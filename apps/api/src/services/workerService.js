const WorkerModel = require("../models/workerModel");

const WorkerService = {
  async fetchAllWorkers() {
    return await WorkerModel.getAll();
  },
  async addWorker(data) {
    return await WorkerModel.create(data);
  },
  async removeWorker(id) {
    await WorkerModel.delete(id);
  }
};

module.exports = WorkerService;
