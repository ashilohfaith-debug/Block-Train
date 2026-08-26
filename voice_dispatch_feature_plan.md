# Voice-Activated Maintenance Dispatch & AI Re-Routing Architecture

This document details the architectural feasibility and step-by-step implementation guide for building the **Admin Voice Dispatch & AI Train Re-Routing** feature. 

This feature involves integrating telephony APIs (like Twilio) for automated worker dispatch, and utilizing the existing xAI Grok integration for real-time train driver advisories.

---

## 1. Feature Workflow

1. **Station Selection & Recording:** The Admin selects a station (e.g., *Tambaram*) on the digital twin map and clicks a "Record Dispatch" button to speak a message (e.g., *"Maintenance block active from 10:00 to 12:00"*).
2. **Automated Worker Dispatch:** The backend instantly looks up the phone numbers of all `ENGINEERING`, `SNT`, and `TRACTION` workers assigned to that station. It triggers simultaneous phone calls to play the audio and sends a fallback SMS.
3. **Block Registration:** The Admin confirms the maintenance block on the UI, locking down the track section in the PostgreSQL database.
4. **AI Real-Time Re-Routing:** The backend identifies all trains approaching the blocked section. It feeds the scenario to the **Grok AI Brain**, which calculates an alternate route (e.g., lane switching, speed reduction).
5. **Driver Notification:** The train driver receives an automated alert on their dashboard containing the Grok AI's exact instructions.

---

## 2. Technical Feasibility & Required Services

**Is it possible?** Absolutely. This is a classic IoT/Operations center workflow. It requires bridging web technologies (WebRTC/Web Audio) with telecom infrastructure and real-time sockets.

### Third-Party Integrations Needed:
* **Twilio (Programmable Voice & SMS):** The industry standard for making API-triggered phone calls and sending SMS.
* **Socket.io or Server-Sent Events (SSE):** For pushing the AI's re-routing instructions to the Train Driver's frontend in real-time without them needing to refresh the page.
* **AWS S3 or Local Uploads:** To temporarily host the recorded audio file so Twilio can play it over the phone.

---

## 3. Implementation Plan (Step-by-Step)

### Phase 1: Database Updates (PostgreSQL)
We need to store worker phone numbers and associate them with stations.
```sql
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN assigned_station VARCHAR(10) REFERENCES stations(code);
```

### Phase 2: The Frontend (Admin Audio Recorder)
1. Build a `VoiceDispatchMenu.tsx` component in Next.js.
2. Use the browser's native **Web Audio API** (`MediaRecorder`) to capture the admin's voice.
3. Convert the recording into a `.webm` or `.mp3` Blob.
4. Send the Blob to a new backend endpoint: `POST /api/dispatch/voice`.

### Phase 3: The Backend (Twilio Integration)
1. **Endpoint Creation:** The `POST /api/dispatch/voice` route receives the audio file and saves it to a public URL (or an S3 bucket).
2. **Fetch Workers:** Query the database for all workers at the selected station:
   `SELECT phone_number FROM users WHERE assigned_station = 'TBM'`
3. **Twilio Voice Call:** Loop through the phone numbers and use the Twilio Node.js SDK to initiate calls. Twilio uses **TwiML** (XML instructions) to know what to do when the worker picks up.
   ```javascript
   client.calls.create({
     twiml: `<Response><Play>https://your-server.com/uploads/recording.mp3</Play></Response>`,
     to: worker.phone_number,
     from: process.env.TWILIO_PHONE_NUMBER
   });
   ```
4. **Twilio SMS:** In the same loop, trigger an SMS:
   ```javascript
   client.messages.create({
     body: "URGENT: Maintenance block scheduled at Tambaram. Please report immediately.",
     to: worker.phone_number,
     from: process.env.TWILIO_PHONE_NUMBER
   });
   ```

### Phase 4: The Grok AI Driver Advisory System
When the Admin finalizes the maintenance block:
1. **Trigger AI Service:** The backend finds all `trains` scheduled to pass through the newly created `block_window`.
2. **Prompt Engineering:** The backend constructs a prompt for Grok inside `src/ai/prompts.js`:
   > *"A maintenance block was just placed on the Express Lane at Tambaram from 10:00 to 12:00. Train 12605 is approaching at 90km/h. Generate a concise, safe rerouting instruction for the loco pilot."*
3. **Real-time Delivery:** The backend receives Grok's response (e.g., *"Reduce speed to 30km/h and divert to Passenger Lane 1 at Chromepet crossover"*).
4. **Socket Push:** The backend emits a Socket.io event `train_advisory` specific to that train's ID.
5. **Driver UI:** The frontend's `LiveTrains` or Driver HUD component listens for this event and pops up a high-priority modal with the AI's instructions.

---

## 4. Why This Works Perfectly with Your Current Setup

* **The Backend is Ready:** Your friend already built `grokClient.js` and `aiService.js`. You just need to add a new prompt template for "Driver Rerouting".
* **The Physics Engine Supports It:** In the frontend `useTrainPhysics.ts`, you already built the logic for trains to dynamically change lanes using the math algorithms. The driver can theoretically click "Accept AI Route" and the train will physically switch lanes in the digital twin map! 
* **High Impact for Hackathon:** Playing an actual live audio recording over a real phone call during a hackathon demo will blow the judges' minds.
