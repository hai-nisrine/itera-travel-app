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
