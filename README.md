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
| `npm run lighthouse` | Lighthouse CI against `dist/`; repeats the run once when Lighthouse reports a runtime error, never on a failed assertion |
| `npm run build` | `prebuild` (`prepare:site`: data, `generate:views`, index; then `check:content`), `ng build`, then `postbuild`: 404/sitemap/robots and output verification. `check:views` and `claims:lock` are run separately |

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
| `src/data/caps.json` | `exeris-docs/cap-license-registry.md`: licence, visibility, `Build` state and readiness `Status` (`poc`, `snapshot` or `released`) per cap, read by header name |
| `src/data/skus.json` | `exeris-docs/high-level-architecture.md` §3.3 and §6.3, plus `status`: the lowest readiness of the SKU's caps |
| `src/data/saga-v2.json` | the CITABLE contract-v2 rows of the tJUG evidence bundle in `exeris-benchmarks` |
| `src/data/build-meta.json` | the latest `exeris-kernel` release, the version of the tooling published on Maven Central and the source commits |

`content/meta/sku-repos.json` lists the SKUs that have a repository. The SKUs page shows a card for
each of them and names every other SKU of the registry as planned; `check-content` fails on a listed
id the registry does not hold and on a card for an id the list does not name. Add an id only when
the repository exists.

Readiness is read from the registry's `Status` column by header name. The older four-column
layout, whose fourth `Status` column holds the build state, is still accepted and reads as `poc`.
A missing column, an empty cell or an unknown value is `poc`, the lowest value: readiness is never
assumed. A SKU is as ready as the least ready cap in it; a SKU-specific cap, which has no registry
row, counts as `poc`.

The tooling version on the Get started page and in the hero is not typed into the content. The
fetch reads Maven Central's `maven-metadata.xml` for `exeris-initializr`, `exeris-app-parent`,
`exeris-app-bom` and `exeris-app-starter`, requires them to agree on one release, checks that the
runnable jar exists, and writes the result to `build-meta.json`. Copy and code samples name it as
`{tooling.version}` (the latest kernel release as `{kernel.version}`); the check fails on any other
version literal.

The JSON is committed, so an offline build works. `SITE_SKIP_FETCH=1` keeps it without fetching;
a fetch error (network failure or HTTP status) falls back to it unless `SITE_FETCH_STRICT=1`; a
parser or consistency failure (a duplicate claim key, an unknown licence, tooling artefacts on
different releases, a missing initializr jar, a missing CITABLE row) always fails the build.
`GITHUB_TOKEN`, when set, is sent to `api.github.com` only, never to Maven Central or
`raw.githubusercontent.com`.

## Gates

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

### Readiness wording

Nothing is released as a product today, so copy must not say that something is sold, supported,
hosted or licensed for production, or invite a sales conversation. The check scans every authored
string: view props and titles (links included), the typed site content, the SEO and search-index
meta files, and rejects the phrases of `READINESS_RULES` in `scripts/check-content.mjs`: sold or
sale, buy and purchase, `production`, support as an offering, a service-level agreement, `CVE`, a hosted or managed
service, a control plane, a production, runtime, perpetual or commercial licence, a subscription or
one-time fee, air-gapped and on-prem, "Contact us" and "Contact sales", "Discuss fit", and any
address on `console.exeris.eu` (which no component or public file may carry either).

Two things keep a legitimate technical use from failing the build:

- Copy attached to a SKU whose `status` is `released` is exempt: a node whose `sku` prop names it, or
  an element of a `skus` list with its `id`. Copy attached to a `poc` or `snapshot` SKU, and all
  site-wide copy, is held to the rules. Quoted claim copy is not authored text and is gated by the
  claims lock.
- `content/meta/readiness-allowlist.json` permits one phrase for one rule, optionally for one view,
  with the reason. Two entries today, both for the SKUs page: the API Gateway's own `admin-control-plane`
  capability, and the name of the licence under which a SKU's source is published at its first release.

When a SKU is released, its exemption follows from the registry; nothing else in the site changes.

`.github/workflows/ci.yml` runs install, data (fetch errors fall back to the committed JSON),
generation, the content check, the determinism check, lint, tests, the build and Lighthouse CI
(`npm run lighthouse`).

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
previous landing site and of the SKU pages merged into `/skus`.

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

## Licences named on the site

The footer names only repositories that are public on GitHub and carry the Apache-2.0 text in their
`LICENSE`, by short name: kernel, SDK, tooling, platform and benchmarks (`exeris-kernel`,
`exeris-sdk`, `exeris-tooling`, `exeris-platform`, `exeris-benchmarks`). `OPEN_SOURCE_REPOS` in `src/content/site.ts` is that list; a repository joins it
only after both facts are checked.

## Licence

Source code: Apache License 2.0 ([LICENSE](LICENSE)). Site copy and brand assets are not
covered by it: © Exeris Systems, all rights reserved ([LICENSE-CONTENT](LICENSE-CONTENT)).
