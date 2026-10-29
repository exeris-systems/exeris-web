---
name: exeris-web-task-classifier
description: Classify a task on the exeris.eu site and turn the class into a route, a primary risk and the must-pass gates. Use when a request lands in exeris-web and its risk or owning role is not yet obvious — a copy edit, a new page, a block, a header, a dependency, a gate. Skip for a one-line change with an obvious owner and no effect on what the site says.
---

# Exeris Web Task Classifier

## Purpose
Decide what kind of change this is **by what it could make the site say or load**, then route it.
This skill does not implement or review.

## Output Contract
Return exactly the fields of `.agents/schemas/triage-result.schema.json`:
`task_class`, `primary_risk`, `primary_agent`, `secondary_handoffs`, `execution_plan`,
`validation_gates` (each a `{gate, risk}` pair), `next_action`.

## Classes
- `CLAIMS_AND_FIGURES` — a number, ratio or comparison in copy; a claim id; `claims.lock.json`;
  `number-allowlist.json`; `src/data/claims.json` or the other benchmark copies.
- `READINESS_WORDING` — availability, price, support, a production licence, a call to action, the
  SKU list, `readiness-allowlist.json`; `src/data/caps.json` or `skus.json`.
- `VIEW_IR_AND_BLOCKS` — a view document, `seo.json`, a route, a `CUSTOM` block, `exeris-codegen.json`.
- `PRIVACY_AND_HEADERS` — `projects/shell/public/_headers`, `public/_redirects`, a new dependency, a font or
  asset, anything that could issue a request from the browser.
- `BUILD_AND_GATES` — `scripts/`, `lighthouserc.json`, `package.json` scripts, `.github/workflows/`.
- `BRAND_AND_LICENCE` — `projects/shell/assets/brand/`, `brand.css`, a licence statement, `OPEN_SOURCE_REPOS`.
- `AGENT_LAYER` — `AGENTS.md`, `.agents/`, `.claude/`.
- `MULTI_DOMAIN` — two of the above are first-order. Name both.

## Routing
- `CLAIMS_AND_FIGURES`, `READINESS_WORDING`, `PRIVACY_AND_HEADERS`, `BRAND_AND_LICENCE` →
  `exeris-web-reviewer` primary; `exeris-web-implementer` secondary when a fix is needed.
- `VIEW_IR_AND_BLOCKS` → `exeris-web-implementer` primary; `exeris-web-reviewer` secondary
  (blocking), `exeris-web-verification` secondary.
- `BUILD_AND_GATES` → `exeris-web-reviewer` primary (is the gate weaker?);
  `exeris-web-verification` secondary (does it run green?).
- `AGENT_LAYER` → `exeris-web-reviewer` primary; the agent-file check is its gate.
- `MULTI_DOMAIN` → `exeris-web-reviewer` first, listing every dominant handoff.

## Gates, tied to the risk
- `npm run check:content` — a typed figure, a changed claim, a readiness phrase, an unmapped block.
- `npm run check:views` — non-deterministic generation.
- `npm run build` (runs `verify-dist`) — a route without metadata, a third-party request, an
  inline script, an unresolved token.
- `npm run lighthouse` — performance, accessibility, best practices, SEO regressions.
- `agents_file_check.py` — the agent layer and the manifest disagree.
- `review / verdict` — the CI review with `docs/repo-review-rules.md`.

Name only the gates the class touches; a list of every gate is not a plan.

## Guardrails
- A copy edit is never "trivial" until it is known to change no figure, status or licence.
- When unsure between two classes, emit `MULTI_DOMAIN` and state both.
