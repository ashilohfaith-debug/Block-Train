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

    const dispatchPromises = phoneNumbers.map(async (phone) => {
      // Send SMS
      await client.messages.create({
        body: messageBody,
        from: fromPhone,
        to: phone
      }).catch(err => console.error("SMS Failed:", err.message));

      // Voice Call
      let twimlParams = {};
      if (audioUrl) {
        twimlParams = { twiml: `<Response><Play>${audioUrl}</Play></Response>` };
      } else {
        twimlParams = { twiml: `<Response><Say voice="alice">${messageBody}</Say></Response>` };
      }

      await client.calls.create({
        ...twimlParams,
        to: phone,
        from: fromPhone
      }).catch(err => console.error("Call Failed:", err.message));
    });

    await Promise.all(dispatchPromises);
    return { success: true, dispatchedTo: phoneNumbers.length };
  }
};

module.exports = DispatchService;
