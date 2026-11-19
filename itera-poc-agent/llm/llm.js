import "dotenv/config";
import { callGemini } from "./providers/gemini.js";
import { callOpenAI } from "./providers/openai.js";

const providers = new Map([
  ["gemini", { call: callGemini, model: "GEMINI_MODEL" }],
  ["openai", { call: callOpenAI, model: "OPENAI_MODEL" }],
]);

// Temporary provider errors worth retrying: rate limit (429) and server overloaded/unavailable (5xx)
const RETRYABLE = [429, 500, 502, 503, 504];
const RETRY_DELAYS_MS = [2000, 5000]; // wait 2s, then 5s => max 3 attempts
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function callLLM({ system, prompt, schema, provider = process.env.LLM_PROVIDER || "gemini" }) {
  const p = providers.get(provider);
  if (!p) throw Error("Unknown LLM provider");
  const messages = typeof prompt === "string" ? [{ role: "user", text: prompt }] : prompt;
  if (
    typeof system !== "string" || !Array.isArray(messages) || !messages.length ||
    messages.some((m) => !m || !["user", "assistant"].includes(m.role) || typeof m.text !== "string") ||
    schema?.type !== "object"
  ) throw Error("Invalid LLM request");
  const model = process.env[p.model];
  if (!model) throw Error("Missing " + p.model);

  const start = Date.now();
  let response;
  for (let attempt = 0; ; attempt++) {
    try {
      response = await p.call({ system, messages, schema, model });
      break;
    } catch (e) {
      if (/^Missing (GEMINI|OPENAI)_API_KEY$/.test(e.message)) throw e;
      if (RETRYABLE.includes(e.status) && attempt < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }
      throw Error(provider + " request failed" + (Number.isInteger(e.status) ? " (HTTP " + e.status + ")" : ""));
    }
  }

  let data;
  try { data = JSON.parse(response.text); } catch { throw Error(provider + " did not return valid JSON"); }
  if (!data || typeof data !== "object" || Array.isArray(data)) throw Error("Invalid LLM response object");
  return { data, usage: response.usage, provider, model, ms: Date.now() - start };
}