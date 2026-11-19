// The organizer agent: conversation -> AI drafts -> code validates -> flags, suggestions, questions

// It NEVER publishes. Publishing only happens in confirmListing.js after explicit confirmation.

import { callLLM } from "../llm/llm.js";
import { AGENT_RESPONSE_SCHEMA, ACCESSIBILITY_FIELDS, FIELD_LABELS } from "./listingSchema.js";
import { buildSystemPrompt } from "./listingPrompt.js";
import { validateListing } from "./validateListing.js";

// Used when the AI forgets to ask about a missing field
const FALLBACK_QUESTIONS = {
  destination: "Where in Morocco does the trip go?",
  departure_city: "Which Moroccan city does the trip leave from?",
  start_date: "What are the exact dates of the trip?",
  duration_days: "How many days does the trip last?",
  price_mad: "What is the price per person in MAD?",
  accessibility:
    "Which specific accommodations does the trip provide? (wheelchair/mobility access, visual assistance, " +
    "sign language support, sensory-friendly, trained personal assistant, service animals, medical equipment storage)",
};

// Accessibility questions count as questions about the "accessibility" group
const groupOf = (field) => (field === "accessibility" || ACCESSIBILITY_FIELDS.includes(field) ? "accessibility" : field);

function checkHistory(history) {
  const ok =
    Array.isArray(history) &&
    history.length > 0 &&
    history.every((m) => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string") &&
    history.at(-1).role === "user";
  if (!ok) throw Error("Invalid conversation");
}

function checkAIResponse(data) {
  const ok =
    data && typeof data.off_topic === "boolean" &&
    data.listing && typeof data.listing === "object" && !Array.isArray(data.listing) &&
    Array.isArray(data.suggestions) && Array.isArray(data.questions);
  if (!ok) throw Error("Malformed listing response");
}

/**
 * @param history  conversation so far: [{ role: "user" | "assistant", content }], last one from the organizer
 * @param options  today (YYYY-MM-DD), provider ("gemini" | "openai"), llm (inject a fake AI in tests),
 *                 previousDraft (the listing returned by the previous turn, so nothing gets forgotten)
 * @returns { status: "needs_info" | "ready" | "off_topic", listing, missing, suggestions, questions, published: false, usage }
 */
export async function createListing(history, { today = new Date().toISOString().slice(0, 10), provider, llm = callLLM, previousDraft = null } = {}) {
  checkHistory(history);

  const { data, usage } = await llm({
    system: buildSystemPrompt(today),
    prompt: history.map((m) => ({ role: m.role, text: m.content })),
    schema: AGENT_RESPONSE_SCHEMA,
    provider, // optional, otherwise LLM_PROVIDER from .env
  });
  checkAIResponse(data);

  if (data.off_topic) {
    return {
      status: "off_topic",
      reply: "I can only help create or edit trip listings. Tell me about the trip you want to publish.",
      published: false,
      usage,
    };
  }

  const listing = data.listing;
  // Every accessibility field must exist; anything that is not "yes"/"no" becomes "unknown", never "yes"
  if (!listing.accessibility || typeof listing.accessibility !== "object") listing.accessibility = {};
  for (const f of ACCESSIBILITY_FIELDS) {
    if (!["yes", "no", "unknown"].includes(listing.accessibility[f])) listing.accessibility[f] = "unknown";
  }
  listing.accessibility_notes ??= null;
  if (!Array.isArray(listing.itinerary)) listing.itinerary = [];
  if (!Array.isArray(listing.activities)) listing.activities = [];
  keepPreviousValues(listing, previousDraft);

  const validation = validateListing(listing, today);
  // Flag EVERY missing required field (eval sheet C2)
  const missing = validation.missing;
  // AI suggestions + problems found by code
  const suggestions = [...data.suggestions.map((s) => ({ ...s, source: "ai" })), ...validation.problems];

  // Questions: keep AI questions about missing fields, add fallbacks for anything it forgot, max 3
  let questions = data.questions.filter((q) => missing.includes(groupOf(q.field)));
  for (const field of missing) {
    if (!questions.some((q) => groupOf(q.field) === field)) questions.push({ field, question: FALLBACK_QUESTIONS[field] });
  }
  questions = questions.slice(0, 3);

  const status = missing.length === 0 && suggestions.length === 0 ? "ready" : "needs_info";
  return { status, listing, missing, suggestions, questions, published: false, usage };
}

// The AI sometimes "forgets" a value from an earlier turn (e.g. resets wheelchair to unknown when the
// organizer only changes the price). Code fills those gaps from the previous draft. The AI can still CHANGE
// a value; it just cannot silently drop one.
const SCALAR_FIELDS = ["title", "destination", "departure_city", "start_date", "duration_days", "price_mad", "accessibility_notes"];
function keepPreviousValues(listing, previous) {
  if (!previous || typeof previous !== "object") return;
  for (const f of SCALAR_FIELDS) if (listing[f] == null && previous[f] != null) listing[f] = previous[f];
  for (const f of ["activities", "itinerary"])
    if (listing[f].length === 0 && Array.isArray(previous[f]) && previous[f].length) listing[f] = previous[f];
  for (const f of ACCESSIBILITY_FIELDS)
    if (listing.accessibility[f] === "unknown" && ["yes", "no"].includes(previous.accessibility?.[f]))
      listing.accessibility[f] = previous.accessibility[f];
}

// The text shown to the organizer (and stored as the "assistant" message)
export function formatReply(result) {
  if (result.status === "off_topic") return result.reply;
  const lines = [];
  if (result.missing.length)
    lines.push(`Missing information (required before publishing): ${result.missing.map((f) => FIELD_LABELS[f] ?? f).join(", ")}.`);
  for (const s of result.suggestions)
    lines.push(`Suggestion (${s.field}): ${s.problem} ${s.suggested_change} Why it matters: ${s.impact_on_travelers}`);
  if (result.status === "ready") lines.push("The draft is complete. Review it and press Confirm to publish.");
  else result.questions.forEach((q, i) => lines.push(`${i + 1}. ${q.question}`));
  return lines.join("\n");
}