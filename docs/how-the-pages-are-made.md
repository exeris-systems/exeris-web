---
title: "How the pages of exeris.eu are made"
type: explanation
visibility: public
owning-repo: exeris-web
status: active
last-verified: 2026-10-29
---

# How the pages of exeris.eu are made

Pages are documents of the Exeris presentation IR (`ViewMetadata`, the shape the SDK's `@View`
processor writes and `@exeris/codegen-ts` reads): one `content/views/view_<name>.json` per page,
a list of regions holding typed blocks. Authored copy is in the blocks' props; SEO titles and
descriptions are in `content/meta/seo.json`. The IR is the source a CMS or Studio can later store
unchanged.

`prebuild` regenerates `src/app/generated` from those documents with `exeris-gen`
(`@exeris/codegen-ts` 0.10.0, pinned in `package.json`; settings in `exeris-codegen.json`). Every
page is the component the generator emits, and the generated tree is neither committed nor edited.

The generator writes the pages, their routes and the binding of each block's props; it does not
write what renders the blocks or the application around them. Almost every block of the IR is a
`CUSTOM` block, rendered by a component of `src/app/blocks/`, because the generator's built-in
block types are generic containers: a `HERO`, `CARD` or `GRID` lays out its children with the UI
kit's classes and has no typed props such as an eyebrow, a lede or a list of calls to action. The shell (navigation, footer, command palette), the SEO
strategy, the build-time data the blocks read and the static prerender setup are the site's own
code. Each of those moves into the generator once it can emit it, and the site then deletes its
copy.

How the site uses the generator today:

- `scaffold: false` writes the pages, their routes and `view.routes.ts` and no app around them;
  `src/app/app.routes.ts` spreads `viewRoutes`, and the prerender list in `app.routes.server.ts`
  is built from the same array.
- `customBlocks` maps each `CUSTOM` block's `customType` to the standalone component in
  `src/app/blocks` that renders it; the generated page imports the component and binds the
  block's `props` JSON to its `props` input. A block that lays out children receives them as
  projected content (`<ng-content />`). The content check fails when a block in
  `src/app/blocks/names.ts` has no entry or an entry points at a file that does not export its
  class.
- `viewHeading: "none"`: the first block of every page carries the page `<h1>`; the generator adds
  none.
- The generator owns the files in `src/app/generated/.exeris-codegen-manifest`: it rewrites them
  when the IR changes and prunes the pages of a deleted view.
- SEO titles, descriptions and canonical URLs are not part of the IR. `SeoTitleStrategy` sets
  them from `content/meta/seo.json` by view name; `npm run index` writes
  `src/data/view-routes.json` (route path to view name) for it.
- The static prerender setup is the site's own (`main.server.ts`, `app.config.server.ts`,
  `app.routes.server.ts`): `render: "ssg"` belongs to the generator's app scaffold, which this site
  does not use.

## Brand and theme

The look is brand kit v6 on top of [`@exeris/ui-kit`](https://www.npmjs.com/package/@exeris/ui-kit):

- `src/styles.css` imports the kit's `theme`, `styles` and `theme-exeris` entries and activates
  the theme with `data-theme="exeris"` on `<html>`.
- `src/styles/brand.css` is the only stylesheet that holds brand colour values; the other
  places, both repeating the page background, are the `theme-color` meta in `src/index.html` and
  `theme_color` and `background_color` in `public/site.webmanifest`. `brand.css` declares the v6
  token names (`--ex-flow-blue`, `--ex-flow-cyan`, `--ex-flow`, `--ex-evidence`, the surface,
  text and line scales, the status colours) and the v6 primitives, and re-points the installed
  theme's rules that still read the earlier palette. When the kit's own `theme-exeris` ships v6,
  delete `brand.css` and its import line; nothing else changes.
- Evidence Orange (`--ex-evidence`) is reserved for figures bound to a registered claim id.
- Brand assets (mark, lockups, icons, social card) are the shipped files of the brand kit, in
  `src/assets/brand/`; they are never redrawn.
- IBM Plex Sans and Mono are self-hosted from `@fontsource`.
