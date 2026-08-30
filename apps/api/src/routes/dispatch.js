const express = require("express");
const multer = require("multer");
const path = require("path");
const DispatchController = require("../controllers/dispatchController");

const router = express.Router();

// Setup Multer to store the file in a memory buffer instead of writing to disk.
// This is strictly required for Serverless (Vercel) since disk is read-only.
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/notify", DispatchController.notify);
router.post("/audio", upload.single("audio"), DispatchController.uploadAudio);

module.exports = router;
