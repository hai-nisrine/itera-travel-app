import test from 'node:test';
import assert from 'node:assert/strict';
import { createDraft, recommend } from './agent.js';
import {travelers,filterTrips} from './traveler/core.js';

const history = [{ role: 'user', content: 'A trip to Rabat.' }];
const listing = () => ({ draft: { destination: 'Rabat', departure_city: 'Casablanca', start_date: '2026-12-10', duration_days: 2, price_mad: 1000, activities: [], itinerary: [], accessibility: { wheelchair_access: 'yes' } }, questions: [], warnings: [] });
async function withModel(t, answer, run) {
    const llm = async () => ({ data: structuredClone(answer), usage: { input: 0, output: 0 }, provider: 'mock', model: 'mock', ms: 0 });
    await run(llm);
}
test('mocked organizer preserves unknown accommodations and caps questions', async t => {
    const answer = listing(); answer.questions = ['one', 'two', 'three', 'four'];
    await withModel(t, answer, async (llm) => { const r = await createDraft(history, { llm }); assert.equal(r.questions.length, 3); assert.equal(r.draft.accessibility.accessible_bathroom, 'unknown'); assert.equal(r.ready_for_review, false); });
});
test('mocked organizer accepts complete draft for review only', async t => {
    await withModel(t, listing(), async (llm) => { const r = await createDraft(history, { llm }); assert.equal(r.ready_for_review, true); assert.equal(r.published, undefined); });
});
test('mocked contradiction warning prevents review readiness', async t => {
    const answer = listing(); answer.warnings = ['Conflicting prices; please clarify.'];
    await withModel(t, answer, async (llm) => assert.equal((await createDraft(history, { llm })).ready_for_review, false));
});
test('mocked organizer normalizes invalid date and field types', async t => {
    const answer = listing(); Object.assign(answer.draft, { start_date: '2026-02-30', destination: 42, departure_city: {}, duration_days: 0, price_mad: -5, accessibility: [] });
    await withModel(t, answer, async (llm) => { const r = await createDraft(history, { llm }); assert.equal(r.ready_for_review, false); for (const key of ['start_date', 'destination', 'departure_city', 'duration_days', 'price_mad']) { assert.equal(r.draft[key], null); assert.ok(r.missing.includes(key)); } assert.equal(r.unverified_accessibility.length, 4); });
});
test('mocked organizer rejects malformed output', async t => {
    for (const answer of [null, { ...listing(), draft: [] }, { ...listing(), questions: [{}] }, { ...listing(), warnings: [null] }]) await withModel(t, answer, (llm) => assert.rejects(createDraft(history, { llm }), /Malformed/));
    await assert.rejects(createDraft([null]), /Invalid conversation/);
});
test('mocked traveler rejects ineligible or malformed model selections', async t => {
    for (const answer of [null, { ids: ['toubkal_hike'] }, { ids: ['invented'] }]) await withModel(t, answer, (llm) => assert.rejects(recommend(travelers[0], { llm }), /invalid or ineligible/));
});
test('mocked traveler returns only verified eligible listings', async t => {
    const allowed = filterTrips(travelers[0]);
    await withModel(t, { ids: [allowed[0].id] }, async (llm) => { const r = await recommend(travelers[0], { llm }); assert.equal(r.mode, 'ai_ranked'); assert.deepEqual(r.recommendations[0].trip, allowed[0]); assert.match(r.recommendations[0].explanation, /MAD/); });
});
test('baseline and no-match paths need no model', async () => {
    assert.equal((await recommend(travelers[0], { useAI: false })).mode, 'deterministic_baseline');
    assert.deepEqual(await recommend(travelers.find(p => p.id === 'nour')), { mode: 'no_matches', recommendations: [] });
});
