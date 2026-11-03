# AGENTS.md — Itera PoC

This is a university proof of concept, not a production system. Optimize for demonstrable AI-native behavior, clarity, safety, and minimal cost.

## Workflows
- Organizer: LLM extracts structured facts from rough descriptions, detects ambiguity, asks up to three useful questions per turn, and prepares a draft. Missing accessibility features remain unknown. No publication without explicit approval.
- Traveler: deterministic code filters budget, dates, duration and all accessibility requirements; LLM ranks only eligible trip IDs and explains using verified listing facts. Never recommend an ineligible trip.

## Technology
Prefer Node.js, plain JavaScript, a single modular backend, local JSON fixtures, and a provider-independent LLM adapter. Do not introduce LangChain, LangGraph, microservices, vector databases, RAG, Docker, PostgreSQL, authentication, payments, or cloud deployment unless a concrete need is approved.

## Development workflow
- Read repository files and tests first.
- Keep changes focused; use a feature branch and open a PR against main.
- Add tests for happy paths, unknown data, contradictions, invalid model output, and hard safety constraints.
- Distinguish mocked tests from real-LLM evaluations.
- Run tests and document exact results and remaining limitations.
- Never merge your own PR; wait for review.
- Do not silently change requirements or claim untested AI quality.
