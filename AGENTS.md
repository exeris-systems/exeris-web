---
title: "exeris-web: the static source of exeris.eu"
type: reference
visibility: public
owning-repo: exeris-web
status: active
last-verified: 2026-10-08
---

# exeris-web: the static source of exeris.eu

The entry point for any AI agent working in this repository. The human-facing description — build
commands, Cloudflare settings, licensing — is in [`README.md`](README.md); this file states
what an editing session must respect.

## Mission and scope

`exeris-web` is the public site of the Exeris platform: an Angular application prerendered at build
time into static HTML, CSS and JavaScript and served as static assets by a Cloudflare Worker.
There is no server.

## Operating contract

**The site sets no cookies, loads no analytics and makes no third-party requests.** A change that
adds a cookie, a tracker, an external font, script or image host, or any runtime request to a
third party changes that promise and is not an implementation detail.

**Generated output is not edited by hand.** `src/app/generated/` is written by Exeris Tooling and
listed in its `.exeris-codegen-manifest`; `src/data/site-sha.json` is produced per build. Change the
generator input, not the output.

**Licensing is split.** Source code is Apache-2.0 ([`LICENSE`](LICENSE)); site copy and brand
assets are all rights reserved ([`LICENSE-CONTENT`](LICENSE-CONTENT)). Do not import copy or assets
whose licence is not compatible with that split.

**Language.** English in every committed artefact.

## Agent material

[`.agents/`](.agents) is the canonical source; [`.agents/manifest.yaml`](.agents/manifest.yaml)
names everything in it and the bundle pin.

| Kind | Where | What |
|---|---|---|
| Roles | `.agents/agents/` | `exeris-web-router` (triage), `exeris-web-reviewer` (verdict), `exeris-web-implementer`, `exeris-web-verification` (gates) |
| Policies | `.agents/policies/` | `public-claims`, `product-readiness`, `no-third-party-requests`, `view-ir-and-generated-output`, `public-repository`, `site-gates` |
| Workflows | `.agents/workflows/` | `web-pr-review`, `page-authoring`, `claims-lock-review` |
| Skills, references, schemas, hooks, evals | `.agents/skills/`, `references/`, `schemas/`, `hooks/`, `evals/` | |

Read the policies a change touches before making it; each names the document it yields to.
`.agents/vendor/` is the digest-verified copy of the organisation bundle `exeris-agents` — never
edit it; bump the version by re-vendoring.

**Hooks.** A push to `main` is a production deploy (Cloudflare Workers Builds builds every push), so the
L0 hooks deny it, along with other outward-facing commands and edits to `src/app/generated/` and
`.agents/vendor/`. A session that changed copy or blocks is held until `npm run check:content` has
run; one that changed the agent layer, until the agent-file check has.

**Adapters.** `.claude/` is rendered from `.agents/` by the shared renderer in
`exeris-systems/exeris-agents` ([`.claude/README.md`](.claude/README.md)); edit the source, never
the adapter.

## Verification and reporting

Before handing off a change, run the gates with the `exeris-web-gate-runner` skill and report each
by its exit code; a gate that could not run here is reported as not run, never as passing. Commands
are in [`.agents/references/build-and-gates.md`](.agents/references/build-and-gates.md).

## Guardrails

[`.github/workflows/guardrails.yml`](.github/workflows/guardrails.yml) calls the organisation's
reusable gates from `exeris-systems/.github`: documentation lint, commit lint, pull-request body,
and the L2 review published as the required check. Do not weaken a gate to make a pull request
pass; a failing gate is either a real finding or a defect in the gate.
