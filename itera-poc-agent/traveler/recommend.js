// Traveler agent: hard filters (code) -> AI ranks eligible trips -> code re-checks the IDs.
// Moved unchanged out of agent.js.
import { callLLM } from '../llm/llm.js';
import { filterTrips, baselineRank, validateRank, explanation } from './core.js';

const obj = (properties) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });
const rankSchema = obj({ ids: { type: "array", items: { type: "string" } } });

export async function recommend(profile, { useAI = true, llm = callLLM } = {}) {
    const allowed = filterTrips(profile);
    if (!allowed.length) return { mode: 'no_matches', recommendations: [] };
    if (!useAI) return { mode: 'deterministic_baseline', recommendations: baselineRank(profile, allowed).map(t => ({ trip: t, explanation: explanation(t, profile) })) };
    const { data: answer } = await llm({ schema: rankSchema, system: 'Rank ONLY eligible Itera trip listings according to traveler interests. Respond JSON object {"ids":[up to 3 unique trip IDs]} ordered best first.', prompt: JSON.stringify({ traveler: profile, eligible_trips: allowed }) });
    return { mode: 'ai_ranked', recommendations: validateRank(answer?.ids, allowed).map(t => ({ trip: t, explanation: explanation(t, profile) })) };
}