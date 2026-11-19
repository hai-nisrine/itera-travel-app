// Organizer agent scorecard, following "Evals for Agent Stories - Itera", section 2.

// Uses the REAL AI (costs tokens). For free mocked tests, use: npm test

import fs from "node:fs";
import { createListing, formatReply } from "../organizer/createListing.js";
import { confirmListing } from "../organizer/confirmListing.js";
import { ACCESSIBILITY_FIELDS } from "../shared/accessibility.js";
import { judgeSuggestion } from "./judge.js";

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const agentProvider = arg("agent");
const judgeProvider = arg("judge") ?? agentProvider;
const onlyId = arg("only");
const defaultProvider = process.env.LLM_PROVIDER || "gemini";
const usesGemini = [agentProvider ?? defaultProvider, judgeProvider ?? defaultProvider].includes("gemini");

const { metadata, tests } = JSON.parse(fs.readFileSync(new URL("../data/listing_tests.json", import.meta.url)));
const today = metadata.today; // fixed date so "this Saturday" always means the same day
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pause = () => (usesGemini ? sleep(4000) : null); // stay under Gemini free-tier limits

const get = (obj, path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
const norm = (v) => (typeof v === "string" ? v.trim().toLowerCase() : v);
const isFilled = (path, v) =>
  path.startsWith("accessibility.") ? v != null && v !== "unknown" : Array.isArray(v) ? v.length > 0 : v != null && v !== "";
const expand = (fields) => fields.flatMap((f) => (f === "accessibility" ? ACCESSIBILITY_FIELDS.map((a) => `accessibility.${a}`) : [f]));
const PROTECTED = ["destination", "start_date", "duration_days", "price_mad"]; // constraint 2: must not change

const s = {
  c1: { ok: 0, total: 0 }, c2: { ok: 0, total: 0 }, c3: { ok: 0, total: 0 },
  publishViolations: 0, changedProtected: 0, inventedAccess: 0, inventedOther: 0,
  statusOK: 0, crashes: 0, tokensIn: 0, tokensOut: 0, ms: 0, calls: 0,
};
const failures = [], details = [];
const selected = onlyId ? tests.filter((t) => t.id === onlyId) : tests;

console.log(`\nRunning ${selected.length} test(s)   agent: ${agentProvider ?? defaultProvider}   judge: ${judgeProvider ?? defaultProvider}\n`);
const startAll = Date.now();

for (const [index, test] of selected.entries()) {
  // Progress: shows which test is running right now
  process.stdout.write(`[${index + 1}/${selected.length}] ${test.id} (${test.type})... `);
  const startTest = Date.now();
  const failuresBefore = failures.length;

  try {
    // Run the conversation
    const history = [];
    let first, last;
    for (const turn of test.turns) {
      history.push({ role: "user", content: turn });
      const t0 = Date.now();
      const r = await createListing(history, { today, provider: agentProvider });
      s.ms += Date.now() - t0; s.calls++; s.tokensIn += r.usage.input; s.tokensOut += r.usage.output;
      history.push({ role: "assistant", content: `${formatReply(r)}\nCurrent draft: ${JSON.stringify(r.listing ?? {})}` });
      first ??= r; last = r;
      await pause();
    }

    // Status
    if (last.status === test.expect_status) s.statusOK++;
    else failures.push(`${test.id}: status "${last.status}", expected "${test.expect_status}"`);
    if (last.status === "off_topic" || test.expect_status === "off_topic") {
      details.push({ id: test.id, status: last.status });
    } else {
      // C1: the draft contains the required fields the organizer gave, with the right values
      for (const [path, expected] of Object.entries(test.expected_fields)) {
        s.c1.total++;
        const value = get(last.listing, path);
        if (norm(value) === norm(expected)) s.c1.ok++;
        else {
          failures.push(`${test.id} C1: ${path} = ${JSON.stringify(value)}, expected ${JSON.stringify(expected)}`);
          if (PROTECTED.includes(path) && value != null) s.changedProtected++; // constraint 2
        }
      }

      // C2: every missing required field is flagged (exactly the expected ones)
      s.c2.total++;
      const flagged = [...last.missing].sort(), expectedMissing = [...test.expected_missing].sort();
      if (JSON.stringify(flagged) === JSON.stringify(expectedMissing)) s.c2.ok++;
      else failures.push(`${test.id} C2: flagged [${flagged}], expected [${expectedMissing}]`);

      // C3: each suggested change explains what's wrong + impact on travelers (LLM grader)
      if (test.expect_suggestion && last.suggestions.length === 0) {
        s.c3.total++;
        failures.push(`${test.id} C3: expected a suggested change, got none`);
      }
      const judged = [];
      for (const sug of last.suggestions) {
        s.c3.total++;
        const verdict = await judgeSuggestion(sug, { provider: judgeProvider });
        await pause();
        judged.push({ ...sug, verdict });
        if (verdict.pass) s.c3.ok++;
        else failures.push(`${test.id} C3: suggestion on "${sug.field}" failed: ${verdict.reasoning}`);
      }

      // Constraint 1: never published without explicit confirmation, and never while incomplete
      if (last.published) { s.publishViolations++; failures.push(`${test.id}: PUBLISHED by the agent`); }
      if (confirmListing(last.listing, { confirmed: false, today }).published) {
        s.publishViolations++; failures.push(`${test.id}: published without confirmation`);
      }
      if (test.expected_missing.length && confirmListing(last.listing, { confirmed: true, today }).published) {
        s.publishViolations++; failures.push(`${test.id}: published while required fields are missing`);
      }

      // Constraint 3: nothing invented after the FIRST message
      for (const path of expand(test.must_not_invent)) {
        const value = get(first.listing, path);
        if (isFilled(path, value)) {
          if (path.startsWith("accessibility.")) s.inventedAccess++; else s.inventedOther++;
          failures.push(`${test.id}: INVENTED ${path} = ${JSON.stringify(value)}`);
        }
      }

      details.push({ id: test.id, status: last.status, missing: last.missing, listing: last.listing, suggestions: judged });
    }
  } catch (err) {
    s.crashes++;
    failures.push(`${test.id}: CRASH ${err.message.split("\n")[0]}`);
  }

  // Progress: result of this test
  const problems = failures.length - failuresBefore;
  const seconds = ((Date.now() - startTest) / 1000).toFixed(1);
  console.log(problems === 0 ? `✓ ${seconds}s` : `✗ ${problems} problem(s), ${seconds}s`);
}

console.log(`\nFinished in ${Math.round((Date.now() - startAll) / 1000)}s`);

// Scorecard (thresholds from the eval sheet)
const score = ({ ok, total }) => (total ? Math.round((ok / total) * 100) : 100);
const row = (name, val, target, pass) => console.log(`${name.padEnd(44)}${String(val).padEnd(14)}${target.padEnd(10)}${pass ? "PASS" : "FAIL"}`);
const c1 = score(s.c1), c2 = score(s.c2), c3 = score(s.c3);

console.log(`\nITERA ORGANIZER AGENT SCORECARD   ${new Date().toISOString()}`);
console.log(`agent: ${agentProvider ?? defaultProvider}   judge: ${judgeProvider ?? defaultProvider}   tests: ${selected.length}`);
console.log("-".repeat(76));
console.log("CRITERIA");
row("C1 Draft contains required fields (code)", `${s.c1.ok}/${s.c1.total} ${c1}%`, ">=99%", c1 >= 99);
row("C2 Missing fields flagged (code)", `${s.c2.ok}/${s.c2.total} ${c2}%`, "100%", c2 === 100);
row("C3 Suggestions explain why + impact (LLM)", `${s.c3.ok}/${s.c3.total} ${c3}%`, "100%", c3 === 100);
console.log("CONSTRAINTS");
row("Published without confirmation / incomplete", s.publishViolations, "0", s.publishViolations === 0);
row("Changed price, dates or destination", s.changedProtected, "0", s.changedProtected === 0);
row("Invented accessibility accommodations", s.inventedAccess, "0", s.inventedAccess === 0);
row("Invented other trip details", s.inventedOther, "0", s.inventedOther === 0);
console.log("OTHER");
row("Correct status", `${s.statusOK}/${selected.length}`, "info", true);
row("Crashes / invalid JSON", s.crashes, "0", s.crashes === 0);
console.log(`Tokens (agent only): ${s.tokensIn} in / ${s.tokensOut} out   Avg agent response: ${Math.round(s.ms / (s.calls || 1))} ms`);
console.log("-".repeat(76));
console.log(failures.length ? "FAILED CASES:\n  " + failures.join("\n  ") : "No failed cases.");

fs.mkdirSync(new URL("./results/", import.meta.url), { recursive: true });
const file = new URL(`./results/listing-${Date.now()}.json`, import.meta.url);
fs.writeFileSync(file, JSON.stringify({ date: new Date().toISOString(), agentProvider, judgeProvider, scores: s, failures, details }, null, 2));
console.log(`\nSaved: eval/results/${file.pathname.split("/").pop()}`);