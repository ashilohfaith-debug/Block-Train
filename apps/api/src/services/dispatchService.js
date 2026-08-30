const DispatchService = {
  async notifyWorkers(phoneNumbers, { blockId, department, date, fromTime, toTime, audioUrl }) {
    console.log(`Mock Dispatch Triggered for ${department} on ${blockId}`);
    
    // External APIs (Twilio/Telegram) have been completely removed per request.
    // We return a mock success so the frontend UI still shows a successful dispatch 
    // and closes the modal cleanly for the presentation.
    
    return { 
      success: true, 
      dispatchedTo: phoneNumbers.length, 
      method: "mock" 
    };
  }
};

module.exports = DispatchService;
