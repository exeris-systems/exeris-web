# exeris-web

The static source of [exeris.eu](https://exeris.eu), the public site of the Exeris platform.

The site is an Angular application that is prerendered at build time into plain HTML, CSS and
JavaScript files. There is no server: the build output is served as static files by Cloudflare
Pages. The site sets no cookies, loads no analytics and makes no third-party requests.

## Build

Requirements: Node.js 24 and npm.

```bash
npm ci
npm run build      # fetches build-time data, generates the pages, prerenders every route
npm test
npm run lint
```

The output is `dist/exeris-web/browser/`, one `index.html` per route.

## Cloudflare Pages

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist/exeris-web/browser` |
| Environment variable | `NODE_VERSION` = `24` |

Pages builds on every push through its Git integration; the repository has no deploy job.

## Brand and theme

The look is brand kit v6 on top of [`@exeris/ui-kit`](https://www.npmjs.com/package/@exeris/ui-kit):

- `src/styles.css` imports the kit's `theme`, `styles`, `preview` and `theme-exeris` entries and
  activates the theme with `data-theme="exeris"` on `<html>`.
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
