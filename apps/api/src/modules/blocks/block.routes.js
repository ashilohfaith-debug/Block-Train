const express = require("express");
const ActiveBlockController = require('./block.controller');

const router = express.Router();

router.get("/", ActiveBlockController.getAll);
router.post("/", ActiveBlockController.create);
router.delete("/:id", ActiveBlockController.delete);

module.exports = router;
