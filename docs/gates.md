---
title: "Build gates of exeris.eu"
type: reference
visibility: public
owning-repo: exeris-web
status: active
last-verified: 2026-10-29
---

# Build gates

- **Claims and content** (`scripts/check-content.mjs`, also a unit test): every claim a page
  references exists and is quotable; every evidence excerpt is a verbatim part of its claim;
  the copy of every quoted claim matches `content/meta/claims.lock.json`; no numeric literal
  appears in `content/` or `src/content/` outside a claim reference or an entry of
  `content/meta/number-allowlist.json`, each of which names its source; every `CUSTOM` block is
  mapped to its component in `exeris-codegen.json`.
- **SKU list** (`scripts/check-content.mjs`): the ids of `content/meta/sku-repos.json` are SKUs of
  the registry, and a SKU card is rendered only for a listed id.
- **Readiness wording** (`scripts/check-content.mjs`, also a unit test): see below.
- **Output** (`scripts/verify-dist.mjs`): every route has its own HTML with title, description,
  canonical and Open Graph tags; no unresolved content token; no third-party request, tracker,
  inline script or cookie write.
- **Lighthouse CI** (`lighthouserc.json`): performance ≥ 0.8, accessibility ≥ 0.9,
  best practices ≥ 0.9, SEO ≥ 0.9 on the static output.

## Readiness wording

Nothing is released as a product today, so copy must not say that something is sold, supported,
hosted or licensed for production, or invite a sales conversation. The check scans every authored
string: view titles and the props of every node, `RICH_TEXT` included (links too), the typed site content, the SEO and search-index
meta files, and rejects the phrases of `READINESS_RULES` in `scripts/check-content.mjs`: sold or
sale, buy and purchase, `production`, support as an offering, a service-level agreement, `CVE`, a hosted or managed
service, a control plane, a production, runtime, perpetual or commercial licence, a subscription or
one-time fee, air-gapped and on-prem, "Contact us" and "Contact sales", "Discuss fit", "request a
demo", "book a demo" and "get a quote", and any
address on `console.exeris.eu` (which no component or public file may carry either).

Two things keep a legitimate technical use from failing the build:

- Copy attached to a SKU whose `status` is `released` is exempt: a node whose `sku` prop names it and the
  nodes nested in it, or an element of a `skus` list with its `id`. Copy attached to a `poc` or `snapshot` SKU, and all
  site-wide copy, is held to the rules. Quoted claim copy is not authored text and is gated by the
  claims lock.
- `content/meta/readiness-allowlist.json` permits one phrase for one rule, optionally for one view,
  with the reason. Two entries today, both for the SKUs page: the API Gateway's own `admin-control-plane`
  capability, and the name of the licence under which a SKU's source is published at its first release.

When a SKU is released, its exemption follows from the registry; nothing else in the site changes.

`.github/workflows/ci.yml` runs install, data (fetch errors fall back to the committed JSON), a
notice listing what changed upstream since `src/data` was committed, generation, the content check,
the determinism check, lint, tests, the build and Lighthouse CI (`npm run lighthouse`), and uploads
the Lighthouse reports as a build artifact.
