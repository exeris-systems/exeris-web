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
commands, Cloudflare Pages settings, licensing — is in [`README.md`](README.md); this file states
what an editing session must respect.

## Mission and scope

`exeris-web` is the public site of the Exeris platform: an Angular application prerendered at build
time into static HTML, CSS and JavaScript and served by Cloudflare Pages. There is no server.

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

[`.agents/`](.agents) holds the pinned, digest-verified copy of the organisation bundle
`exeris-agents` under `.agents/vendor/`. This repository authors no profiles, skills or workflows of
its own; [`.agents/manifest.yaml`](.agents/manifest.yaml) records the pin. Never edit the vendored
tree — bump the version by re-vendoring.

## Guardrails

[`.github/workflows/guardrails.yml`](.github/workflows/guardrails.yml) calls the organisation's
reusable gates from `exeris-systems/.github`: documentation lint, commit lint, pull-request body,
and the L2 review published as the required check. Do not weaken a gate to make a pull request
pass; a failing gate is either a real finding or a defect in the gate.
