const express = require("express");
const twilio = require("twilio");

const router = express.Router();

// Initialize Twilio client only if credentials exist
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;
const testWorkerPhone = process.env.TEST_WORKER_PHONE;

let client = null;
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

// POST trigger dispatch
router.post("/notify", async (req, res, next) => {
  try {
    const { blockId, department, date, fromTime, toTime } = req.body;
    
    if (!client || !fromPhone || !testWorkerPhone) {
      console.warn("Twilio credentials not fully configured. Skipping SMS dispatch.");
      return res.json({ 
        success: false, 
        message: "Twilio credentials missing. SMS skipped.",
        mocked: true 
      });
    }

    const messageBody = `URGENT [BlockTrain]: Maintenance Block scheduled for ${department} on ${blockId} from ${fromTime} to ${toTime} on ${date}. Please report to the track immediately.`;

    // Send SMS
    const message = await client.messages.create({
      body: messageBody,
      from: fromPhone,
      to: testWorkerPhone
    });

    console.log(`Twilio SMS sent to ${testWorkerPhone}. SID: ${message.sid}`);
    
    // Optionally trigger a voice call (uncomment to enable)
    /*
    await client.calls.create({
      twiml: `<Response><Say voice="alice">${messageBody}</Say></Response>`,
      to: testWorkerPhone,
      from: fromPhone
    });
    */

    res.json({ success: true, messageId: message.sid });
  } catch (error) {
    console.error("Twilio Dispatch Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
