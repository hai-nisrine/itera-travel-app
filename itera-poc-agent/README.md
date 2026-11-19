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
Requires Node.js 20+. Run `npm test` and `npm start`. Server binds to localhost:3000. GET /api/fixtures lists synthetic data. POST /api/match accepts `{profile, useAI:false}` to exercise the deterministic baseline. POST /api/listing accepts `{history:[{role:'user',content:'...'}]}` as JSON. Run `npm install` first. Copy `.env.example` to `.env`, fill in your own keys, and select `LLM_PROVIDER=gemini` or `openai`. Run `npm run test:llm` to check both real providers (billable). Never commit keys.

## Baseline limitations
Fixtures are a projection of the supplied synthetic data and expected eligibility sets, not a byte-for-byte import. Organizer extraction is preliminary; explicit publishing, verified evidence, contradiction state, and real LLM evaluation remain unimplemented. Traveler explanations are deterministic. The original local prototype passed 13 tests; this branch requires independent execution.

## Independent branch validation

`npm test` now runs 25 tests: the original 13 checks plus hard-filter regression tests, mocked organizer/traveler model responses, and an HTTP integration test that starts and stops its own server. All 25 passed on Node.js 24.22.1. The HTTP check covers fixtures, deterministic recommendations, no matches, malformed JSON, invalid conversation input, and unknown routes. No dependencies need installation.

Validation now rejects impossible calendar dates, negative prices/budgets, nonpositive durations, malformed organizer fields, and invalid ranking responses. Organizer warnings or outstanding clarification questions prevent `ready_for_review`; that flag never publishes a listing.

These tests use synthetic fixtures and mocked model responses, not real-model evaluation. Accessibility evidence is not independently verified; organizer factual extraction and contradiction detection still depend on model behavior and require human review. Publishing and persistent conversation/contradiction state remain unimplemented. Fixture answer-key agreement validates the committed projection only, not the unavailable original dataset. Issue #1 and PR #2 descriptions/review comments could not be retrieved during this review because GitHub API access returned Forbidden; compliance with those additional requirements remains unchecked.

## Dual-provider integration
Both agents use callLLM with standard JSON Schema. OpenAI uses Responses API; Gemini uses generateContent. The smoke test checks known synthetic facts and unknown accessibility, token counts and latency. Model availability, dependency installation, existing mock compatibility and live calls remain unverified for this update. Earlier test counts do not apply to the new adapter.

## Traveler-side schema correction (2026-11-19)

The synthetic `data/Itera_PoC_15_Trips_10_Travelers.json` now stores 10 traveler fixtures as `{user, accessibility_profile, preferences, test_label}`. `user` and `accessibility_profile` use **only** fields from the provided PostgreSQL `users` and `accessibility_profiles` tables; `accessibility_profile.user_id` refers to `user.id`. `password_hash` contains **nonfunctional synthetic placeholders**, not real password hashes. These fixtures must not be inserted as actual credentials.

`preferences` is **PoC-only input**, not part of either of those two tables. Budget, travel dates, duration, interests, and departure-country constraints have no supplied persistence schema. Do not add database columns without an explicit schema decision.

The 15 pre-existing agency trip objects were not edited. Their accessibility flags still use older names. The traveler matcher recognizes `wheelchair_access` as a legacy synonym for `wheelchair_mobility_accessible` and requires exact explicit evidence for the other six database boolean accommodations. It does **not** infer `visual_assistance` or `trained_personal_assistant` from the generic `assistance_available`. Former bathroom/transport/unspecified-assistance requirements are retained in `additional_info` and **fail closed** pending a human-verified accommodation interpretation. Any nonempty `additional_info` currently blocks automated matching, which is deliberately conservative, not a complete natural-language solution.

`data/Itera_PoC_Expected_Results.json` was regenerated for those safeguards. Run `npm run eval:traveler` to check deterministic matching and ranking without API keys; run `npm test` after `npm ci` for mock/HTTP tests. `eval:traveler` does not measure real AI quality or guarantee accessible travel; all agency facts are synthetic and unverified.
