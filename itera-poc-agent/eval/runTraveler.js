// Deterministic traveler agent evaluation. No API key, provider, or tokens required.
import fs from 'node:fs';
import { travelers, trips, filterTrips, baselineRank, validTraveler } from '../traveler/core.js';
import { ACCESSIBILITY_FIELDS } from '../shared/accessibility.js';

const expectations = JSON.parse(fs.readFileSync(new URL('../data/Itera_PoC_Expected_Results.json', import.meta.url), 'utf8')).tests;
const failures = [];
let passed = 0;
for (const traveler of travelers) {
  const name = traveler.user.name;
  const expected = expectations.find(x => x.user_id === traveler.user.id);
  const allowed = filterTrips(traveler);
  const ranked = baselineRank(traveler, allowed);
  const checks = {
    schema: validTraveler(traveler) && ACCESSIBILITY_FIELDS.every(f => typeof traveler.accessibility_profile[f] === 'boolean'),
    expected_eligible: !!expected && JSON.stringify(allowed.map(x => x.id).sort()) === JSON.stringify([...expected.eligible_trip_ids].sort()),
    at_most_three: ranked.length <= 3,
    eligible_only: ranked.every(t => allowed.some(a => a.id === t.id)),
    no_over_budget: ranked.every(t => t.price_mad <= traveler.preferences.budget_max_mad),
    departure_from_morocco: ranked.every(t => t.departure_country === 'Morocco'),
    interests_ranked: ranked.every((t, i) => i === 0 ||
      ranked[i - 1].activities.filter(a => traveler.preferences.interests.includes(a)).length >=
      t.activities.filter(a => traveler.preferences.interests.includes(a)).length),
  };
  const ok = Object.values(checks).every(Boolean);
  if (ok) passed++; else failures.push({ traveler: name, checks });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: ${allowed.length} eligible, ${ranked.length} recommended`);
}
console.log(`\nTraveler evaluation: ${passed}/${travelers.length} cases passed; ${trips.length} agency listings examined.`);
console.log('This evaluates deterministic filtering and ranking, not real LLM quality.');
if (failures.length) { console.error(JSON.stringify(failures,null,2)); process.exitCode = 1; }
