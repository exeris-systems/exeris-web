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

## Licence

Source code: Apache License 2.0 ([LICENSE](LICENSE)). Site copy and brand assets are not
covered by it: © Exeris Systems, all rights reserved ([LICENSE-CONTENT](LICENSE-CONTENT)).
