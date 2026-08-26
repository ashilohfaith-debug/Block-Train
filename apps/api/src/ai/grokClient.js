/**
 * ============================================================
 * src/ai/grokClient.js  —  Low-level xAI Grok API Client
 * ============================================================
 *
 * PURPOSE
 * -------
 * This is the ONLY file in the codebase that talks directly to
 * the xAI Grok REST API.  Keeping it isolated here means:
 *   • All other modules never need to know the API URL or HTTP
 *     call mechanics — they just import and call sendChatCompletion().
 *   • If xAI changes their API, there is exactly ONE file to update.
 *
 * HOW GROK IS USED IN RAILTWIN
 * -----------------------------
 * Grok is used ONLY to generate human-readable explanations and
 * risk classifications.  It NEVER makes scheduling decisions,
 * NEVER modifies database records, and NEVER controls trains.
 * All authoritative results come from the deterministic optimization
 * engine.  Grok output is advisory text only.
 *
 * SAFETY RULES
 * ------------
 *  • XAI_API_KEY is read from environment variables — never hard-coded.
 *  • The API key is NEVER logged anywhere.
 *  • If the key is missing, a descriptive error is thrown so
 *    that callers (aiService.js) can fall back to deterministic logic.
 *
 * STRUCTURED OUTPUT (jsonMode)
 * ----------------------------
 * When `options.jsonMode = true` is passed, the request tells Grok
 * to respond with a valid JSON object.  This makes parsing reliable
 * and allows callers to validate the structure before using it.
 */

// Base URL for the xAI Chat Completions endpoint.
const XAI_API_URL = "https://api.x.ai/v1/chat/completions";

/**
 * Sends a chat completion request to the xAI Grok API using Node's
 * native fetch (available in Node 18+).
 *
 * @param {Array<{role: string, content: string}>} messages
 *   The conversation array.  Typically contains:
 *     [{ role: "system", content: <system prompt> },
 *      { role: "user",   content: <user prompt>   }]
 *
 * @param {Object}  options             - Optional API parameters.
 * @param {boolean} options.jsonMode    - If true, forces JSON object output.
 * @param {number}  options.temperature - Sampling temperature (0 = most deterministic).
 *
 * @returns {Promise<string>} The raw text content of Grok's reply.
 * @throws  {Error} If the API key is missing, the HTTP call fails, or
 *                  the response structure is unexpected.
 */
async function sendChatCompletion(messages, options = {}) {
  // Read the API key from the process environment.
  // It must be set in .env as XAI_API_KEY=...
  const apiKey = process.env.XAI_API_KEY;

  // Default to grok-4.6 if no model override is configured.
  const model = process.env.XAI_MODEL || "grok-4.6";

  // Fail early if the key is not configured — this lets aiService.js
  // catch the error and fall back to deterministic responses.
  if (!apiKey) {
    throw new Error("Missing XAI_API_KEY environment variable.");
  }

  // Build the request body.
  // temperature 0.2 produces focused, consistent outputs which is
  // important for operations-grade advisory text.
  const body = {
    model,
    messages,
    temperature: options.temperature !== undefined ? options.temperature : 0.2,
    // response_format is only set when jsonMode is requested.
    // The "json_object" type instructs Grok to always return parseable JSON.
    response_format: options.jsonMode ? { type: "json_object" } : undefined
  };

  // Make the HTTP POST request using Node's built-in fetch.
  const response = await fetch(XAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Bearer token authentication — API key injected here, never logged.
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  // Non-2xx response means something went wrong on the API side
  // (rate limit, invalid model, bad key, etc.).
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`xAI API responded with status ${response.status}: ${errorText}`);
  }

  // Parse the successful JSON response.
  const data = await response.json();

  // Validate the expected response structure.
  // The OpenAI-compatible format wraps the model's reply inside:
  //   data.choices[0].message.content
  if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
    throw new Error("Invalid response structure from xAI API.");
  }

  // Return the raw text content from the model's reply.
  // Callers (aiService.js) are responsible for JSON.parse() if needed.
  return data.choices[0].message.content;
}

module.exports = {
  sendChatCompletion
};
