const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER || "+17372212163";

let client = null;
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

const DispatchService = {
  async notifyWorkers(phoneNumbers, { blockId, department, date, fromTime, toTime, audioUrl }) {
    if (!client || !fromPhone) {
      console.warn("Twilio credentials missing. SMS skipped.");
      return { success: false, error: "TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN missing in server environment variables. Please add them to Render." };
    }

    const messageBody = `URGENT [BlockTrain]: Maintenance Block scheduled for ${department} on ${blockId} from ${fromTime} to ${toTime} on ${date}.`;

    const errors = [];
    const dispatchPromises = phoneNumbers.map(async (phone) => {
      // Ensure E.164 format with +91 if they only provided 10 digits
      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = formattedPhone.startsWith('91') && formattedPhone.length === 12 
          ? `+${formattedPhone}` 
          : `+91${formattedPhone}`;
      }

      // Send SMS
      try {
        await client.messages.create({
          body: messageBody,
          from: fromPhone,
          to: formattedPhone
        });
      } catch (err) {
        console.error("SMS Failed:", err.message);
        errors.push(`SMS to ${formattedPhone} failed: ${err.message}`);
      }

      // Voice Call
      let twimlParams = {};
      if (audioUrl) {
        twimlParams = { twiml: `<Response><Play>${audioUrl}</Play></Response>` };
      } else {
        twimlParams = { twiml: `<Response><Say voice="alice">${messageBody}</Say></Response>` };
      }

      try {
        await client.calls.create({
          ...twimlParams,
          to: formattedPhone,
          from: fromPhone
        });
      } catch (err) {
        console.error("Call Failed:", err.message);
        errors.push(`Call to ${formattedPhone} failed: ${err.message}`);
      }
    });

    await Promise.all(dispatchPromises);
    
    if (errors.length > 0) {
      return { success: false, error: errors.join(" | ") };
    }
    
    return { success: true, dispatchedTo: phoneNumbers.length };
  }
};

module.exports = DispatchService;
