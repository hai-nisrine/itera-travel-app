import { callLLM } from './llm/llm.js';
import { filterTrips, baselineRank, validateRank, explanation, validDate } from './traveler/core.js';

const required = ['destination', 'departure_city', 'start_date', 'duration_days', 'price_mad'];
const accessibility = ['wheelchair_access', 'accessible_bathroom', 'step_free_transport', 'assistance_available'];
const obj = (properties) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });
const str = { type: "string" }, nullable = (type) => ({ type: [type, "null"] }), strings = { type: "array", items: str };
const listingSchema = obj({ draft: obj({ destination: nullable("string"), departure_city: nullable("string"), start_date: nullable("string"), duration_days: nullable("integer"), price_mad: nullable("number"), activities: strings, itinerary: strings, accessibility: obj(Object.fromEntries(accessibility.map(k => [k, { type: "string", enum: ["yes", "no", "unknown"] }]))) }), questions: strings, warnings: strings });
const rankSchema = obj({ ids: strings });

export async function createDraft(history, { llm = callLLM } = {}) {
    if (!Array.isArray(history) || !history.length || history.some(x => !x || !['user', 'assistant'].includes(x.role) || typeof x.content !== 'string')) throw Error('Invalid conversation');
    const { data: result } = await llm({ schema: listingSchema, system: 'You are Itera’s trip-listing agent. Extract ONLY facts explicitly stated by the organizer, including earlier turns. Never invent dates, price, destinations, itinerary, or accessibility features. Return JSON object with keys draft, questions, warnings. draft must have destination, departure_city, start_date (YYYY-MM-DD or null), duration_days (integer or null), price_mad (number or null), activities (array), accessibility (object with wheelchair_access, accessible_bathroom, step_free_transport, assistance_available each yes/no/unknown), and itinerary (array). Missing non-accessibility fields are null. Never interpret vague accessible claims as a specific confirmed accommodation. If contradictions exist, warn and ask clarification. Ask at most 3 concise questions. No publication action. JSON only.', prompt: history.map(m => ({ role: m.role, text: m.content })) });
    if (!result || !result.draft || typeof result.draft !== 'object' || Array.isArray(result.draft) || !Array.isArray(result.questions) || result.questions.some(x => typeof x !== 'string') || !Array.isArray(result.warnings) || result.warnings.some(x => typeof x !== 'string')) throw Error('Malformed listing response');
    const d = result.draft;
    for (const k of required) if (!(k in d)) d[k] = null;
    if (!d.accessibility || typeof d.accessibility !== 'object' || Array.isArray(d.accessibility)) d.accessibility = {};
    for (const k of accessibility) if (!['yes', 'no', 'unknown'].includes(d.accessibility[k])) d.accessibility[k] = 'unknown';
    for (const k of ['destination', 'departure_city']) if (typeof d[k] !== 'string' || !d[k].trim()) d[k] = null;
    const missing = required.filter(k => d[k] === null || d[k] === '');
    if (!Number.isFinite(d.price_mad) || d.price_mad <= 0) { if (!missing.includes('price_mad')) missing.push('price_mad'); d.price_mad = null; }
    if (!Number.isInteger(d.duration_days) || d.duration_days < 1) { if (!missing.includes('duration_days')) missing.push('duration_days'); d.duration_days = null; }
    if (d.start_date !== null && !validDate(d.start_date)) { missing.push('start_date'); d.start_date = null; }
    if (!Array.isArray(d.activities)) d.activities = [];
    if (!Array.isArray(d.itinerary)) d.itinerary = [];
    return { draft: d, missing: [...new Set(missing)], unverified_accessibility: accessibility.filter(k => d.accessibility[k] === 'unknown'), questions: result.questions.slice(0, 3), warnings: result.warnings, ready_for_review: missing.length === 0 && result.warnings.length === 0 && result.questions.length === 0 && accessibility.some(k => d.accessibility[k] === 'yes') };
}

export async function recommend(profile, { useAI = true, llm = callLLM } = {}) {
    const allowed = filterTrips(profile);
    if (!allowed.length) return { mode: 'no_matches', recommendations: [] };
    if (!useAI) return { mode: 'deterministic_baseline', recommendations: baselineRank(profile, allowed).map(t => ({ trip: t, explanation: explanation(t, profile) })) };
    const { data: answer } = await llm({ schema: rankSchema, system: 'Rank ONLY eligible Itera trip listings according to traveler interests. Respond JSON object {"ids":[up to 3 unique trip IDs]} ordered best first.', prompt: JSON.stringify({ traveler: profile, eligible_trips: allowed }) });
    return { mode: 'ai_ranked', recommendations: validateRank(answer?.ids, allowed).map(t => ({ trip: t, explanation: explanation(t, profile) })) };
}
