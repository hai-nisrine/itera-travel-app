import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { trips, travelers, filterTrips, baselineRank, validateRank, validTraveler } from '../traveler/core.js';
import { ACCESSIBILITY_FIELDS } from '../shared/accessibility.js';
import { recommend } from '../traveler/recommend.js';

const expected = JSON.parse(fs.readFileSync(new URL('../data/Itera_PoC_Expected_Results.json', import.meta.url), 'utf8')).tests;
const copy = x => structuredClone(x);
const get = name => travelers.find(t => t.user.name.toLowerCase() === name);
const noNeedsTraveler = get('karim');

test('15 agency listings and 10 traveler records', () => {
  assert.equal(trips.length, 15);
  assert.equal(travelers.length, 10);
  assert.equal(new Set(travelers.map(t => t.user.id)).size, 10);
});
test('traveler database objects contain exactly the schema columns', () => {
  const userCols = ['id', 'name', 'email', 'phone_number', 'password_hash', 'created_at', 'updated_at'];
  const profileCols = ['id', 'user_id', ...ACCESSIBILITY_FIELDS, 'additional_info', 'created_at', 'updated_at'];
  for (const t of travelers) {
    assert.deepEqual(Object.keys(t.user).sort(), userCols.sort());
    assert.deepEqual(Object.keys(t.accessibility_profile).sort(), profileCols.sort());
    assert.equal(t.user.id, t.accessibility_profile.user_id);
    assert.equal(validTraveler(t), true);
    assert.equal(Object.hasOwn(t.user, 'budget_max_mad'), false);
    assert.equal(Object.hasOwn(t.accessibility_profile, 'needs'), false);
  }
});
for (const traveler of travelers) {
  test(`hard filters match answer key: ${traveler.user.name}`, () => {
    const answer = expected.find(x => x.user_id === traveler.user.id);
    assert.ok(answer);
    const actual = filterTrips(traveler).map(x => x.id).sort();
    assert.deepEqual(actual, [...answer.eligible_trip_ids].sort());
    const ranked = baselineRank(traveler, filterTrips(traveler));
    assert.ok(ranked.length <= 3);
    assert.ok(ranked.every(x => actual.includes(x.id)));
  });
}
test('missing and nonboolean accessibility fields fail closed', () => {
  const t = copy(noNeedsTraveler);
  for (const field of ACCESSIBILITY_FIELDS) {
    const invalid = copy(t);
    delete invalid.accessibility_profile[field];
    assert.equal(validTraveler(invalid), false);
    assert.deepEqual(filterTrips(invalid), []);
    invalid.accessibility_profile[field] = null;
    assert.deepEqual(filterTrips(invalid), []);
  }
});
test('all 7 required accommodations reject unknown, no and missing agency evidence', () => {
  const baseline = copy(noNeedsTraveler);
  const trip = filterTrips(baseline)[0];
  assert.ok(trip);
  for (const field of ACCESSIBILITY_FIELDS) {
    const traveler = copy(baseline);
    traveler.accessibility_profile[field] = true;
    const agencyField = field === 'wheelchair_mobility_accessible' ? 'wheelchair_access' : field;
    for (const value of ['unknown', 'no', undefined]) {
      const t = copy(trip);
      if (value === undefined) delete t.accessibility[agencyField];
      else t.accessibility[agencyField] = value;
      assert.deepEqual(filterTrips(traveler, [t]), [], `${field}: ${value}`);
    }
    const confirmed = copy(trip);
    confirmed.accessibility[agencyField] = 'yes';
    assert.equal(filterTrips(traveler, [confirmed]).length, 1);
  }
});
test('generic agency assistance does not prove visual or trained assistant support', () => {
  const traveler = copy(noNeedsTraveler);
  traveler.accessibility_profile.trained_personal_assistant = true;
  assert.deepEqual(filterTrips(traveler), []);
  traveler.accessibility_profile.trained_personal_assistant = false;
  traveler.accessibility_profile.visual_assistance = true;
  assert.deepEqual(filterTrips(traveler), []);
});
test('unstructured additional_info requirements are never silently ignored', () => {
  const traveler = copy(noNeedsTraveler);
  traveler.accessibility_profile.additional_info = 'Requires accessible bathroom';
  assert.deepEqual(filterTrips(traveler), []);
});
test('reject invalid dates, negative prices and invalid durations', () => {
  const t = copy(noNeedsTraveler), trip = filterTrips(t)[0];
  for (const patch of [{ duration_days: 0 }, { duration_days: -1 }, { price_mad: -1 }, { start_date: '2026-02-30' }, { start_date: '2026-12-1' }]) {
    assert.deepEqual(filterTrips(t, [{ ...trip, ...patch }]), []);
  }
  for (const patch of [{ max_duration_days: 0 }, { budget_max_mad: -1 }, { available_from: '2026-02-30' }, { available_to: '2026-13-01' }]) {
    assert.deepEqual(filterTrips({ ...t, preferences: { ...t.preferences, ...patch } }, [trip]), []);
  }
});
test('rank validation rejects invented, duplicate and excessive trip IDs', () => {
  const allowed = filterTrips(noNeedsTraveler), id = allowed[0].id;
  for (const ids of [null, {}, [1], [id, id], [id, id, id, id], ['invented']]) assert.throws(() => validateRank(ids, allowed));
  assert.deepEqual(validateRank([id], allowed), [allowed[0]]);
});
test('mocked AI cannot recommend an ineligible trip', async () => {
  for (const answer of [null, { ids: ['invented'] }, { ids: ['toubkal_hike'] }]) {
    const llm = async () => ({ data: answer });
    await assert.rejects(recommend(get('imane'), { llm }), /invalid or ineligible/);
  }
});
test('mocked AI selects only eligible records', async () => {
  const eligible = filterTrips(get('imane'));
  const llm = async () => ({ data: { ids: [eligible[0].id] } });
  const result = await recommend(get('imane'), { llm });
  assert.equal(result.mode, 'ai_ranked');
  assert.deepEqual(result.recommendations[0].trip, eligible[0]);
  assert.match(result.recommendations[0].explanation, /MAD/);
});
test('deterministic ranking and no-match paths', async () => {
  assert.equal((await recommend(get('karim'), { useAI: false })).mode, 'deterministic_baseline');
  assert.deepEqual(await recommend(get('nour')), { mode: 'no_matches', recommendations: [] });
});
