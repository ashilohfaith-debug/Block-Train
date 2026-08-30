const express = require("express");
const multer = require("multer");
const path = require("path");
const DispatchController = require("../controllers/dispatchController");

const router = express.Router();

// Setup Multer for audio uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, `dispatch-${Date.now()}.mp3`);
  }
});
const upload = multer({ storage });

router.post("/notify", DispatchController.notify);
router.post("/audio", upload.single("audio"), DispatchController.uploadAudio);

module.exports = router;
