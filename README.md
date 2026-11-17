# Itera AI Agent — Proof of Concept

University Agile project demonstrating two AI-native workflows for accessible group travel in Morocco.

## Goals
1. Organizer: turn messy natural-language trip descriptions into structured drafts, ask targeted clarification questions, and require explicit confirmation.
2. Traveler: apply deterministic accessibility/budget/date safeguards, then use an LLM to rank eligible trips and explain matches.

## Principles
- Small modular Node.js application; avoid enterprise infrastructure.
- Prefer free and open-source dependencies and models.
- Never invent accessibility features or silently relax hard constraints.
- Evaluate actual model behavior separately from mocked tests.

## Development
See AGENTS.md for implementation and PR instructions.

## Status
Repository initialization in progress. No real-model performance has yet been established.

## Run the prototype
Requires Node.js 20+. Run `npm test` and `npm start`. Server binds to localhost:3000. GET /api/fixtures lists synthetic data. POST /api/match accepts `{profile, useAI:false}` to exercise the deterministic baseline. POST /api/listing accepts `{history:[{role:'user',content:'...'}]}` as JSON. For real AI set LLM_BASE_URL (OpenAI-compatible API base), LLM_MODEL and optionally LLM_API_KEY before starting. Never commit keys.

## Baseline limitations
Fixtures are a projection of the supplied synthetic data and expected eligibility sets, not a byte-for-byte import. Organizer extraction is preliminary; explicit publishing, verified evidence, contradiction state, and real LLM evaluation remain unimplemented. Traveler explanations are deterministic. The original local prototype passed 13 tests; this branch requires independent execution.

## Independent branch validation

`npm test` now runs 25 tests: the original 13 checks plus hard-filter regression tests, mocked organizer/traveler model responses, and an HTTP integration test that starts and stops its own server. All 25 passed on Node.js 24.22.1. The HTTP check covers fixtures, deterministic recommendations, no matches, malformed JSON, invalid conversation input, and unknown routes. No dependencies need installation.

Validation now rejects impossible calendar dates, negative prices/budgets, nonpositive durations, malformed organizer fields, and invalid ranking responses. Organizer warnings or outstanding clarification questions prevent `ready_for_review`; that flag never publishes a listing.

These tests use synthetic fixtures and mocked model responses, not real-model evaluation. Accessibility evidence is not independently verified; organizer factual extraction and contradiction detection still depend on model behavior and require human review. Publishing and persistent conversation/contradiction state remain unimplemented. Fixture answer-key agreement validates the committed projection only, not the unavailable original dataset. Issue #1 and PR #2 descriptions/review comments could not be retrieved during this review because GitHub API access returned Forbidden; compliance with those additional requirements remains unchecked.
