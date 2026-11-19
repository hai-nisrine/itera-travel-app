// Mocked organizer tests

// They test OUR code (validation, flags, publish gate), not the real AI's quality

import test from "node:test";
import assert from "node:assert/strict";
import { createListing, formatReply } from "../organizer/createListing.js";
import { confirmListing } from "../organizer/confirmListing.js";
import { validateListing } from "../organizer/validateListing.js";
import { AGENT_RESPONSE_SCHEMA } from "../organizer/listingSchema.js";
import { ACCESSIBILITY_FIELDS } from "../shared/accessibility.js";

const TODAY = "2026-11-01";
const history = [{ role: "user", content: "4-day trip from Casablanca to Marrakech..." }];
const unknownAll = () => Object.fromEntries(ACCESSIBILITY_FIELDS.map((f) => [f, "unknown"]));

// A complete, valid AI answer; each test changes one thing
const aiAnswer = (overrides = {}) => ({
  off_topic: false,
  listing: {
    title: "Marrakech Trip", destination: "Marrakech", departure_city: "Casablanca",
    start_date: "2026-11-10", duration_days: 4, price_mad: 3000, activities: ["culture"],
    itinerary: [1, 2, 3, 4].map((day) => ({ day, plan: "plan" })),
    accessibility: { ...unknownAll(), wheelchair_mobility_accessible: "yes" },
    accessibility_notes: null,
    ...overrides.listing,
  },
  suggestions: overrides.suggestions ?? [],
  questions: overrides.questions ?? [],
  ...(overrides.off_topic !== undefined && { off_topic: overrides.off_topic }),
});
const fakeLLM = (answer) => async () => ({ data: structuredClone(answer), usage: { input: 0, output: 0 } });
const run = (answer) => createListing(history, { today: TODAY, llm: fakeLLM(answer) });

test("complete draft with one confirmed accommodation is ready, flags nothing, and is not published", async () => {
  const r = await run(aiAnswer());
  assert.equal(r.status, "ready");
  assert.deepEqual(r.missing, []);
  assert.equal(r.published, false);
});

test("every missing required field is flagged, not just 3 (C2)", async () => {
  const r = await run(aiAnswer({ listing: { destination: null, departure_city: null, start_date: null, price_mad: null, accessibility: unknownAll() } }));
  assert.deepEqual(r.missing.sort(), ["accessibility", "departure_city", "destination", "price_mad", "start_date"]);
  assert.equal(r.status, "needs_info");
  assert.ok(r.questions.length <= 3);
});

test("all accessibility unknown = accessibility flagged as missing", async () => {
  const r = await run(aiAnswer({ listing: { accessibility: unknownAll() } }));
  assert.deepEqual(r.missing, ["accessibility"]);
  assert.equal(r.questions[0].field, "accessibility");
});

test("invalid or missing accessibility values become unknown, never yes", async () => {
  const r = await run(aiAnswer({ listing: { accessibility: { wheelchair_mobility_accessible: "yes", visual_assistance: "probably", deaf_sign_support: true } } }));
  assert.equal(r.listing.accessibility.visual_assistance, "unknown");
  assert.equal(r.listing.accessibility.deaf_sign_support, "unknown");
  assert.equal(r.listing.accessibility.medical_equipment_storage, "unknown");
});

test("past date is kept unchanged and turned into a suggestion with a reason and traveler impact", async () => {
  const r = await run(aiAnswer({ listing: { start_date: "2026-10-01" } }));
  assert.equal(r.listing.start_date, "2026-10-01");
  const s = r.suggestions.find((x) => x.field === "start_date");
  assert.ok(s.problem && s.suggested_change && s.impact_on_travelers);
  assert.equal(r.status, "needs_info");
});

test("AI suggestion blocks ready and appears in the reply", async () => {
  const sug = { field: "price_mad", problem: "30 MAD looks like a typo.", suggested_change: "Check the price.", impact_on_travelers: "Travelers filter by budget." };
  const r = await run(aiAnswer({ suggestions: [sug] }));
  assert.equal(r.status, "needs_info");
  assert.match(formatReply(r), /30 MAD looks like a typo/);
});

test("AI questions about fields that are not missing are dropped; fallbacks fill gaps", async () => {
  const r = await run(aiAnswer({ listing: { price_mad: null }, questions: [{ field: "destination", question: "Where?" }] }));
  assert.deepEqual(r.questions.map((q) => q.field), ["price_mad"]);
});

test("off-topic message is refused", async () => {
  const r = await run(aiAnswer({ off_topic: true }));
  assert.equal(r.status, "off_topic");
  assert.equal(r.published, false);
});

test("invalid conversation and malformed AI output are rejected", async () => {
  await assert.rejects(createListing([null], { llm: fakeLLM(aiAnswer()) }), /Invalid conversation/);
  await assert.rejects(createListing([{ role: "user", text: "x" }], { llm: fakeLLM(aiAnswer()) }), /Invalid conversation/);
  await assert.rejects(createListing(history, { llm: fakeLLM({ listing: {} }) }), /Malformed listing response/);
});

test("history uses `content` and is sent to the AI as `text`", async () => {
  let sent;
  const spy = async (req) => { sent = req; return { data: aiAnswer(), usage: { input: 0, output: 0 } }; };
  await createListing(history, { today: TODAY, llm: spy });
  assert.deepEqual(sent.prompt, [{ role: "user", text: history[0].content }]);
});

test("publish gate: needs explicit confirmation AND a complete draft", async () => {
  const complete = (await run(aiAnswer())).listing;
  assert.equal(confirmListing(complete, { today: TODAY }).published, false);
  assert.equal(confirmListing(complete, { confirmed: "yes", today: TODAY }).published, false);
  assert.equal(confirmListing(complete, { confirmed: true, today: TODAY }).published, true);
  const incomplete = (await run(aiAnswer({ listing: { start_date: null } }))).listing;
  assert.equal(confirmListing(incomplete, { confirmed: true, today: TODAY }).published, false);
  assert.equal(confirmListing(null, { confirmed: true }).published, false);
});

test("validation rejects impossible dates and bad numbers", () => {
  const base = aiAnswer().listing;
  for (const bad of [{ start_date: "2026-02-31" }, { duration_days: 0 }, { duration_days: 2.5 }, { price_mad: -5 }]) {
    assert.equal(validateListing({ ...base, ...bad }, TODAY).isComplete, false, JSON.stringify(bad));
  }
});

test("schema is OpenAI strict-compatible: every object requires all keys and allows no extras", () => {
  const walk = (node) => {
    if (node?.type === "object") {
      assert.equal(node.additionalProperties, false);
      assert.deepEqual([...node.required].sort(), Object.keys(node.properties).sort());
      Object.values(node.properties).forEach(walk);
    }
    if (node?.items) walk(node.items);
  };
  walk(AGENT_RESPONSE_SCHEMA);
});

test("values from the previous turn are kept when the AI forgets them, but can still be changed", async () => {
  const previousDraft = aiAnswer().listing; // wheelchair yes, price 3000
  const forgetful = aiAnswer({ listing: { price_mad: 2000, destination: null, accessibility: unknownAll() } });
  const r = await createListing(history, { today: TODAY, llm: fakeLLM(forgetful), previousDraft });
  assert.equal(r.listing.price_mad, 2000); // changed value wins
  assert.equal(r.listing.destination, "Marrakech"); // forgotten value restored
  assert.equal(r.listing.accessibility.wheelchair_mobility_accessible, "yes"); // forgotten value restored
  assert.equal(r.listing.accessibility.visual_assistance, "unknown"); // never invented
  assert.equal(r.status, "ready");
});