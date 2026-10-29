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
| `npm run data` | Downloads the upstream registers into `src/data/*.json` ([build-time data](docs/build-time-data.md)) |
| `npm run generate:views` | Runs `exeris-gen generate` over `content/views` into `src/app/generated` |
| `npm run check:content` | The claims and content gate |
| `npm run check:views` | Fails if two page generations differ |
| `npm run claims:lock` | Accepts the current copy of every quoted claim after review |
| `npm run lighthouse` | Lighthouse CI against `dist/`; repeats the run once when Lighthouse reports a runtime error, never on a failed assertion |
| `npm run build` | `prebuild` (`prepare:site`: data, `generate:views`, index; then `check:content`), `ng build`, then `postbuild`: 404/sitemap/robots and output verification. `check:views` and `claims:lock` are run separately |

## Documentation

- [How the pages are made](docs/how-the-pages-are-made.md): the View IR, the generator settings,
  the prerender, and the brand and theme.
- [Build-time data](docs/build-time-data.md): the upstream registers, what each JSON file holds,
  the fetch fallback and the token rules.
- [Build gates](docs/gates.md): the content, claims, readiness-wording, output and Lighthouse
  checks, and what CI runs.

## Cloudflare Pages

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist/exeris-web/browser` |
| Environment variable | `NODE_VERSION` = `24` |
| Secret (recommended) | `GITHUB_TOKEN`: a fine-grained token with read access to public repositories only, so the build's GitHub API calls are not rate-limited |

Pages builds on every push through its Git integration; the repository has no deploy job. Pages
sets `CF_PAGES=1`, which makes `npm run data` strict: a failed fetch fails the deploy instead of
publishing the committed data.
`public/_headers` sets the security headers (a same-origin Content-Security-Policy with no
inline script) and long caching for hashed assets; `public/_redirects` maps the paths of the
previous landing site and of the SKU pages merged into `/skus`.

## Licences named on the site

The footer names only repositories that are public on GitHub and carry the Apache-2.0 text in their
`LICENSE`, by short name: kernel, SDK, tooling, platform, Spring Runtime, benchmarks and docs
(`exeris-kernel`, `exeris-sdk`, `exeris-tooling`, `exeris-platform`, `exeris-spring-runtime`,
`exeris-benchmarks`, `exeris-docs`). This repository is left out: its code is Apache-2.0 but its
copy is not. `OPEN_SOURCE_REPOS` in `src/content/site.ts` is that list; a repository joins it
only after both facts are checked.

## Licence

Source code: Apache License 2.0 ([LICENSE](LICENSE)). Site copy and brand assets are not
covered by it: © Exeris Systems, all rights reserved ([LICENSE-CONTENT](LICENSE-CONTENT)).
