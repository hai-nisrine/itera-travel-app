import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import {trips,travelers,filterTrips,baselineRank,validateRank} from './traveler/core.js'; 

const expected = JSON.parse(fs.readFileSync(new URL('./data/Itera_PoC_Expected_Results.json', import.meta.url), 'utf8'));

test('fixture integrity', () => { assert.equal(trips.length, 15); assert.equal(travelers.length, 10); });
for (const profile of travelers) {
    test('hard-filter matches answer key: ' + profile.id, () => {
        const answer = expected.find(x => x.traveler_id === profile.id); assert.ok(answer);
        const actual = filterTrips(profile).map(x => x.id).sort(); assert.deepEqual(actual, [...answer.eligible_trip_ids].sort());
        const ranked = baselineRank(profile, filterTrips(profile)); assert.ok(ranked.length <= 3);
        assert.ok(ranked.every(x => actual.includes(x.id)));
    });
}
test('reject unsafe LLM rank', () => { assert.throws(() => validateRank(['toubkal_hike'], filterTrips(travelers[0]))); });
test('reject missing accessibility data', () => { assert.deepEqual(filterTrips({ ...travelers[0], needs: { ...travelers[0].needs, wheelchair: null } }), []); });

test('reject invalid dates and nonpositive durations before ranking', () => {
    const p = travelers[0], t = filterTrips(p)[0];
    for (const patch of [{ duration_days: 0 }, { duration_days: -1 }, { price_mad: -1 }, { start_date: '2026-02-30' }, { start_date: '2026-12-1' }]) assert.deepEqual(filterTrips(p, [{ ...t, ...patch }]), []);
    for (const patch of [{ max_duration_days: 0 }, { budget_max_mad: -1 }, { available_from: '2026-02-30' }, { available_to: '2026-13-01' }]) assert.deepEqual(filterTrips({ ...p, ...patch }, [t]), []);
});
test('every required accessibility feature fails closed on unknown data', () => {
    const p = travelers[0], t = filterTrips(p)[0];
    for (const [need, field] of Object.entries({ wheelchair: 'wheelchair_access', accessible_bathroom: 'accessible_bathroom', step_free_transport: 'step_free_transport', needs_assistance: 'assistance_available' })) {
        for (const value of ['unknown', 'no', undefined]) assert.deepEqual(filterTrips({ ...p, needs: { ...p.needs, [need]: true } }, [{ ...t, accessibility: { ...t.accessibility, [field]: value } }]), []);
    }
});
test('rank validation rejects malformed, duplicate and excessive selections', () => {
    const allowed = filterTrips(travelers[0]), id = allowed[0].id;
    for (const ids of [null, {}, [1], [id, id], [id, id, id, id], ['invented']]) assert.throws(() => validateRank(ids, allowed));
    assert.deepEqual(validateRank([id], allowed), [allowed[0]]);
});
