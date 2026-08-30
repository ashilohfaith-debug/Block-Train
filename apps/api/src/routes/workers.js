const express = require("express");
const WorkerController = require("../controllers/workerController");

const router = express.Router();

// Route mappings
router.get("/", WorkerController.getAll);
router.post("/", WorkerController.create);
router.delete("/:id", WorkerController.delete);

module.exports = router;
