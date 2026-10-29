---
name: exeris-web-view-ir-review
description: Review or plan a page change on exeris.eu against the View IR pipeline — view documents, CUSTOM blocks and their registry, route metadata, and the untouchable generated tree. Use whenever a diff adds, renames or edits a content/views document, content/meta/seo.json, src/app/blocks, exeris-codegen.json, app routes, or anything under src/app/generated.
---

# Exeris Web View IR Review

## Purpose
Enforce `.agents/policies/view-ir-and-generated-output.md`: a page is a document a tool can edit,
and the generator owns what it writes. Used by the reviewer to judge and by the implementer to
plan.

## Procedure
1. **Generated output.** Any path under `src/app/generated/` or its `.exeris-codegen-manifest` in
   the diff → rule 1, whatever the content.
2. **Bypass.** A new component or route that renders a page the IR could express → rule 2. Name
   the IR construct that would have expressed it.
3. **Blocks.** For each new or changed `CUSTOM` block: a standalone component in `src/app/blocks/`,
   named in `names.ts`, mapped by `customType` in `exeris-codegen.json`; children by projection
   (rule 3).
4. **Generator gaps.** A workaround for something the generator should emit → rule 4. The pull
   request names the `exeris-tooling` change or issue.
5. **Headings.** The page's first block carries its `<h1>` (rule 5).
6. **Route metadata.** For an added or renamed route: view document, `seo.json` entry with a unique
   title and a description, canonical on `https://exeris.eu` equal to the route, Open Graph and
   Twitter tags, sitemap entry, `_redirects` for a rename; the 404 page `noindex` (rule 6).
7. **Determinism.** Anything that makes generation depend on time, order or environment (rule 7).

## Decision Logic
- **BLOCKED**: an edit to generated output; a page that bypasses the IR it could use.
- **CONDITIONAL**: a block outside the registry; missing route metadata; a lasting generator
  workaround with no `exeris-tooling` reference; a renamed route with no redirect.
- **PASS**: the page is a document, its blocks are registered, its route complete.
