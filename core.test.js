import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {trips,travelers,filterTrips,baselineRank,validateRank} from './core.js';
const expected=JSON.parse(fs.readFileSync(new URL('./data/Itera_PoC_Expected_Results.json',import.meta.url))).tests;
test('fixture integrity',()=>{assert.equal(trips.length,15);assert.equal(travelers.length,10);});
for(const profile of travelers){test('hard-filter matches answer key: '+profile.id,()=>{
 const answer=expected.find(x=>x.traveler_id===profile.id);assert.ok(answer);
 const actual=filterTrips(profile).map(x=>x.id).sort();assert.deepEqual(actual,[...answer.eligible_trip_ids].sort());
 const ranked=baselineRank(profile,filterTrips(profile));assert.ok(ranked.length<=3);
 assert.ok(ranked.every(x=>actual.includes(x.id)));
});}
test('reject unsafe LLM rank',()=>{assert.throws(()=>validateRank(['toubkal_hike'],filterTrips(travelers[0])));});
test('reject missing accessibility data',()=>{assert.deepEqual(filterTrips({...travelers[0],needs:{...travelers[0].needs,wheelchair:null}}),[]);});
