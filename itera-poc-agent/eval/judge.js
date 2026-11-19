// LLM grader for criterion C3: "Each suggested change must include a reason that states
// what's wrong and how the change affects travelers."

import { callLLM } from "../llm/llm.js";

const SYSTEM = `You are a strict grader. You check ONE suggestion that an AI assistant made to a travel agency
about their trip listing on Itera, a platform for disabled travelers.

The suggestion PASSES only if BOTH are true:
1. explains_problem: it clearly states what is wrong with the listing (not just "please check").
2. explains_traveler_impact: it clearly states how the problem or the change affects travelers
   (for example safety, accessibility, booking, budget, planning). A generic phrase like "for a better experience" is NOT enough.

Judge only what is written. Be strict.`;

const SCHEMA = {
  type: "object",
  properties: {
    explains_problem: { type: "boolean" },
    explains_traveler_impact: { type: "boolean" },
    reasoning: { type: "string" },
  },
  required: ["explains_problem", "explains_traveler_impact", "reasoning"],
  additionalProperties: false,
};

export async function judgeSuggestion(suggestion, { provider, llm = callLLM } = {}) {
  const { field, problem, suggested_change, impact_on_travelers } = suggestion;
  const { data } = await llm({
    system: SYSTEM,
    prompt: `Suggestion to grade:\n${JSON.stringify({ field, problem, suggested_change, impact_on_travelers }, null, 2)}`,
    schema: SCHEMA,
    provider,
  });
  return { pass: data.explains_problem === true && data.explains_traveler_impact === true, ...data };
}