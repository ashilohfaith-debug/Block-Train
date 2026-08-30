const express = require("express");
const ActiveBlockController = require("../controllers/activeBlockController");

const router = express.Router();

router.get("/", ActiveBlockController.getAll);
router.post("/", ActiveBlockController.create);
router.delete("/:id", ActiveBlockController.delete);

module.exports = router;
