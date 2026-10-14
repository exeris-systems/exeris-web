# exeris-web

The static source of [exeris.eu](https://exeris.eu), the public site of the Exeris platform.

The site is an Angular 22 application prerendered at build time into plain HTML, CSS and
JavaScript. There is no server: the output is served as static files by Cloudflare Pages. The
site sets no cookies, loads no analytics and makes no third-party requests.

## Build

Requirements: Node.js 24 and npm.

```bash
npm ci
npm run build      # data, page generation, content check, prerender, output verification
npm test
npm run lint
npm run serve:dist # serve dist/ the way Cloudflare Pages does, on http://127.0.0.1:4173
```

The output is `dist/exeris-web/browser/`: one `index.html` per route, `404.html`,
`sitemap.xml`, `robots.txt`, `_headers` and `_redirects`.

| Script | What it does |
|---|---|
| `npm run data` | Downloads the upstream registers into `src/data/*.json` (see below) |
| `npm run generate:views` | Runs `exeris-gen generate` over `content/views` into `src/app/generated` |
| `npm run check:content` | The claims and content gate |
| `npm run check:views` | Fails if two page generations differ |
| `npm run claims:lock` | Accepts the current copy of every quoted claim after review |
| `npm run build` | All of the above before `ng build`; `postbuild` adds 404/sitemap/robots and verifies the output |

## How the pages are made

Pages are documents of the Exeris presentation IR (`ViewMetadata`, the shape the SDK's `@View`
processor writes and `@exeris/codegen-ts` reads): one `content/views/view_<name>.json` per page,
a list of regions holding typed blocks. Authored copy is in the blocks' props; SEO titles and
descriptions are in `content/meta/seo.json`. The IR is the source a CMS or Studio can later store
unchanged.

`prebuild` regenerates `src/app/generated` from those documents with `exeris-gen`
(`@exeris/codegen-ts` 0.10.0, pinned in `package.json`; settings in `exeris-codegen.json`). Every
page is the component the generator emits, and the generated tree is neither committed nor edited:

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

## Build-time data

`scripts/fetch-data.mjs` reads, from the `main` branch of each repository:

| File | Source |
|---|---|
| `src/data/claims.json` | `exeris-benchmarks/docs/CLAIMS.md`, registered copy strings keyed `L12.absolute`, `L13.floor`, … |
| `src/data/cold-start.json` | `exeris-benchmarks/results/cold-start-ttfr/<arm>/20260626T104113Z-n8-res/result.json`, medians for the five arms of L14 |
| `src/data/caps.json` | `exeris-docs/cap-license-registry.md` |
| `src/data/skus.json` | `exeris-docs/high-level-architecture.md` §3.3 and §6.3 |
| `src/data/saga-v2.json` | the CITABLE contract-v2 rows of the tJUG evidence bundle in `exeris-benchmarks` |
| `src/data/build-meta.json` | the latest `exeris-kernel` release and the source commits |

The JSON is committed, so an offline build works. `SITE_SKIP_FETCH=1` keeps it without fetching;
a network error falls back to it unless `SITE_FETCH_STRICT=1`. `GITHUB_TOKEN`, when set, is used
for the GitHub API calls.

## Gates

- **Claims and content** (`scripts/check-content.mjs`, also a unit test): every claim a page
  references exists and is quotable; every evidence excerpt is a verbatim part of its claim;
  the copy of every quoted claim matches `content/meta/claims.lock.json`; no numeric literal
  appears in `content/` or `src/content/` outside a claim reference or an entry of
  `content/meta/number-allowlist.json`, each of which names its source; every `CUSTOM` block is
  mapped to its component in `exeris-codegen.json`.
- **Output** (`scripts/verify-dist.mjs`): every route has its own HTML with title, description,
  canonical and Open Graph tags; no unresolved content token; no third-party request, tracker,
  inline script or cookie write.
- **Lighthouse CI** (`lighthouserc.json`): performance ≥ 0.8, accessibility ≥ 0.9,
  best practices ≥ 0.9, SEO ≥ 0.9 on the static output.

`.github/workflows/ci.yml` runs install, data (with fallback), generation, the content check,
the determinism check, lint, tests, the build and Lighthouse CI.

## Cloudflare Pages

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist/exeris-web/browser` |
| Environment variable | `NODE_VERSION` = `24` |

Pages builds on every push through its Git integration; the repository has no deploy job.
`public/_headers` sets the security headers (a same-origin Content-Security-Policy with no
inline script) and long caching for hashed assets; `public/_redirects` maps the paths of the
previous landing site.

## Brand and theme

The look is brand kit v6 on top of [`@exeris/ui-kit`](https://www.npmjs.com/package/@exeris/ui-kit):

- `src/styles.css` imports the kit's `theme`, `styles` and `theme-exeris` entries and activates
  the theme with `data-theme="exeris"` on `<html>`.
- `src/styles/brand.css` is the only file that holds brand colour values. It declares the v6
  token names (`--ex-flow-blue`, `--ex-flow-cyan`, `--ex-flow`, `--ex-evidence`, the surface,
  text and line scales, the status colours) and the v6 primitives, and re-points the installed
  theme's rules that still read the earlier palette. When the kit's own `theme-exeris` ships v6,
  delete `brand.css` and its import line; nothing else changes.
- Evidence Orange (`--ex-evidence`) is reserved for figures bound to a registered claim id.
- Brand assets (mark, lockups, icons, social card) are the shipped files of the brand kit, in
  `src/assets/brand/`; they are never redrawn.
- IBM Plex Sans and Mono are self-hosted from `@fontsource`.

## Licence

Source code: Apache License 2.0 ([LICENSE](LICENSE)). Site copy and brand assets are not
covered by it: © Exeris Systems, all rights reserved ([LICENSE-CONTENT](LICENSE-CONTENT)).
