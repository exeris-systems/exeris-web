---
name: page-authoring
description: Add or rename a page on exeris.eu the way the site is built — a View IR document, its SEO entry, registered blocks, route metadata — then gate and review it. Use when a new route is needed or an existing one is renamed.
argument-hint: The page's purpose and route, e.g. "/security — the security model"
steps:
  - {agent: exeris-web-implementer, skill: exeris-web-view-ir-review}
  - {agent: exeris-web-verification, skill: exeris-web-gate-runner, gate: "script:npm run check:content"}
  - {agent: exeris-web-reviewer, gate: verdict}
gates: ["script:npm run check:content", "script:npm run check:views", "script:npm run build"]
---

Add or rename the page described below.

Page: $ARGUMENTS

1. **Plan from the IR.** Read two existing documents in `content/views/` that resemble the page,
   and build it from the block types they use. A `CUSTOM` block is the exception: add one only for
   something no IR block expresses, and register it (`src/app/blocks/`, `names.ts`,
   `exeris-codegen.json`).
2. **Write the document** at `content/views/view_<name>.json`. The first block carries the `<h1>`.
3. **Copy.** Every figure is a claim reference; every availability sentence is true at the
   registry's status; versions are tokens. If the page needs a claim the register does not have,
   stop and say so — the claim is added in `exeris-benchmarks` first.
4. **Metadata.** Add the `content/meta/seo.json` entry: a title no other route uses, a description,
   no figure. Confirm the route reaches the sitemap source. For a rename, add the old path to
   `public/_redirects`.
5. **Generate and gate.** `npm run check:content`, `npm run check:views`, `npm run build`. Never
   edit `src/app/generated/` to fix what they report.
6. **Review** with `exeris-web-reviewer` and report its verdict.
