# Policy: Pages Are View IR; Generated Output Is Not Patched

A page is a document of the Exeris presentation IR, `content/views/view_<name>.json`, read by
`@exeris/codegen-ts` into `src/app/generated/`. The IR is the source a CMS or Studio can later store
unchanged, so a page that bypasses it is a page no tool can edit. How the pipeline runs is
`docs/how-the-pages-are-made.md`; the severities are `docs/repo-review-rules.md` S3 and S5.

## Hard Rules

1. **`src/app/generated/` is never edited and never committed.** The generator owns every file its
   `.exeris-codegen-manifest` lists, rewrites them when the IR changes and prunes the pages of a
   deleted view. Change the document, not the output.
2. **A page the IR can express is a view document.** Reaching the same visible result with a
   hand-written component or route is a bypass.
3. **A `CUSTOM` block goes through the registry.** Its `customType` is mapped in
   `exeris-codegen.json` `customBlocks` to a standalone component in `src/app/blocks/`, and named
   in `src/app/blocks/names.ts`. A block that lays out children receives them by projection.
4. **A generator gap is fixed in `exeris-tooling`.** When the IR cannot express something, the
   change is to the generator, named in the pull request. A workaround here that stays is debt.
5. **The first block carries the `<h1>`.** `viewHeading` is `none`; the generator adds no heading.
6. **Every route carries its own metadata.** A route has a view document, an entry in
   `content/meta/seo.json` with a title no other route uses and a description, a canonical URL on
   `https://exeris.eu`, Open Graph and Twitter tags, and an entry in the sitemap source. The 404
   page is `noindex`.
7. **Generation is deterministic.** Two generations of the same documents are byte-identical.

## Verification

- `npm run check:content`: every `CUSTOM` block mapped, every mapping pointing at an exported class.
- `npm run check:views`: determinism.
- `scripts/verify-dist.mjs`: per-route HTML with title, description, canonical and Open Graph tags,
  and no unresolved content token.
