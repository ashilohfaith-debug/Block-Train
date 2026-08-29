const express = require("express");
const twilio = require("twilio");
const multer = require("multer");
const path = require("path");
const pool = require("../db");

const router = express.Router();

// Setup Multer for audio uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../../uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, `dispatch-${Date.now()}.mp3`);
  }
});
const upload = multer({ storage });

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

let client = null;
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

// POST /notify - Automatically called by Chatbot
router.post("/notify", async (req, res) => {
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

    if (!client || !fromPhone) {
      console.warn("Twilio credentials missing. SMS skipped.");
      return res.json({ success: false, mocked: true });
    }

    const messageBody = `URGENT [BlockTrain]: Maintenance Block scheduled for ${department} on ${blockId} from ${fromTime} to ${toTime} on ${date}.`;

    // 2. Dispatch SMS and Call to ALL workers
    const dispatchPromises = phoneNumbers.map(async (phone) => {
      // Send SMS
      await client.messages.create({
        body: messageBody,
        from: fromPhone,
        to: phone
      }).catch(err => console.error("SMS Failed:", err.message));

      // 2. Voice Call (Custom audio or Text-to-Speech fallback)
      let twimlParams = {};
      if (audioUrl) {
        twimlParams = { twiml: `<Response><Play>${audioUrl}</Play></Response>` };
      } else {
        // Fallback to text-to-speech
        twimlParams = { twiml: `<Response><Say voice="alice">${messageBody}</Say></Response>` };
      }

      await client.calls.create({
        ...twimlParams,
        to: phone,
        from: fromPhone
      }).catch(err => console.error("Call Failed:", err.message));
    });

    await Promise.all(dispatchPromises);
    res.json({ success: true, dispatchedTo: phoneNumbers.length });
  } catch (error) {
    console.error("Twilio Dispatch Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /audio - For Admin to upload recorded audio
router.post("/audio", upload.single("audio"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }
    // Return the relative URL of the uploaded file
    // Note: For Twilio to access this, the server needs to be on a public domain or ngrok
    const publicUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, audioUrl: publicUrl });
  } catch (err) {
    console.error("Audio Upload Error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

module.exports = router;
