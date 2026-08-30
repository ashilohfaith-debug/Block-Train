const DispatchService = require('./dispatch.service');
const CloudinaryService = require('./cloudinary.service');
const pool = require('../../core/db'); // Using pool for now since we haven't refactored WorkerModel fully for department lookup yet, or we can write a raw query. Wait, let's just do raw query to ensure we don't break anything

const DispatchController = {
  /**
   * @route   POST /api/dispatch/notify
   * @desc    Trigger SMS and Voice Calls for workers
   * @access  Public
   */
  async notify(req, res) {
    try {
      const { blockId, department, date, fromTime, toTime, audioUrl } = req.body;
      
      // 1. Find all workers for this department
      const { rows } = await pool.query(
        "SELECT phone FROM workers WHERE department = $1",
        [department]
      );
      const phoneNumbers = rows.map(r => r.phone);

      if (phoneNumbers.length === 0) {
        return res.json({ success: true, message: "No workers found for this department." });
      }

      const result = await DispatchService.notifyWorkers(phoneNumbers, { blockId, department, date, fromTime, toTime, audioUrl });
      res.json(result);

    } catch (error) {
      console.error("Twilio Dispatch Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * @route   POST /api/dispatch/audio
   * @desc    Handle audio file upload from admin dashboard directly to Cloudinary
   * @access  Public
   */
  async uploadAudio(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file uploaded" });
      }

      // Upload directly from memory buffer to Cloudinary
      const cloudinaryUrl = await CloudinaryService.uploadAudioStream(req.file.buffer);

      // Return the permanent public Cloudinary URL to the frontend
      res.json({ success: true, audioUrl: cloudinaryUrl });
    } catch (err) {
      console.error("Audio Upload Error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
};

module.exports = DispatchController;
