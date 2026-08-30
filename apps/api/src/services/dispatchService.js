const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8601089913:AAEEm4wlQ_0GcOEIKaJaYodXmzg83Ds6M_k";
// We will use a fallback chat ID if the env var isn't set yet
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "6774806866";

const DispatchService = {
  async notifyWorkers(phoneNumbers, { blockId, department, date, fromTime, toTime, audioUrl }) {
    console.log("Telegram Dispatch Triggered for:", department);
    
    // For the hackathon demo, we will route all alerts to the specified Telegram Chat ID
    // instead of the raw phone numbers from the database.
    const targetChatId = TELEGRAM_CHAT_ID;
    
    if (!TELEGRAM_BOT_TOKEN || !targetChatId) {
      console.warn("Telegram credentials missing.");
      return { success: false, error: "Missing Telegram Bot Token or Chat ID." };
    }

    const messageBody = `🚨 *URGENT [BlockTrain]* 🚨\n\nMaintenance Block scheduled for *${department}*.\n*Track:* ${blockId}\n*Time:* ${fromTime} to ${toTime}\n*Date:* ${date}\n\n_Please listen to the attached emergency voice dispatch._`;

    const errors = [];
    
    try {
      // 1. Send the Text Alert
      const textResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: messageBody,
          parse_mode: 'Markdown'
        })
      });
      
      const textData = await textResponse.json();
      if (!textData.ok) {
        errors.push(`Telegram Text Error: ${textData.description}`);
      }

      // 2. Send the Audio File
      if (audioUrl) {
        const audioResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendAudio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: targetChatId,
            audio: audioUrl,
            caption: "🔊 Emergency Voice Dispatch"
          })
        });
        
        const audioData = await audioResponse.json();
        if (!audioData.ok) {
          errors.push(`Telegram Audio Error: ${audioData.description}`);
        }
      }
      
    } catch (err) {
      console.error("Telegram API Failed:", err.message);
      errors.push(`Telegram API Failed: ${err.message}`);
    }

    if (errors.length > 0) {
      return { success: false, error: errors.join(" | ") };
    }
    
    return { success: true, dispatchedTo: 1, method: "telegram" };
  }
};

module.exports = DispatchService;
