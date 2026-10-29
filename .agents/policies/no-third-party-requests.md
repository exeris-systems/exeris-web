# Policy: No Cookie, No Analytics, No Third-Party Request

`AGENTS.md` states it as the operating contract: the site sets no cookies, loads no analytics and
makes no third-party requests. It is a promise to every visitor, not an implementation detail, and
it is kept by the Content-Security-Policy in `projects/shell/public/_headers` and by `scripts/verify-dist.mjs`.
The severity is `docs/repo-review-rules.md` S4.

## Hard Rules

1. **Nothing is fetched from another origin at runtime.** No external font, script, stylesheet,
   image, frame or API host. Fonts are self-hosted from `@fontsource`; build-time data is fetched
   by `scripts/fetch-data.mjs` during the build and committed, never by the browser.
2. **No cookie and no tracking identifier.** No cookie write, and no `localStorage` or
   `sessionStorage` value that identifies a visitor.
3. **No analytics, tag manager or beacon**, first-party or otherwise.
4. **No inline script and no inline event handler.** The policy is `script-src 'self'`.
5. **The CSP is not loosened.** An edit to `projects/shell/public/_headers` that adds `unsafe-inline`,
   `unsafe-eval`, a host or a wildcard to a fetch directive changes the promise.
6. **A link is not a request.** An `<a href>` to another site navigates on a click and is judged as
   copy (licence and hygiene), not under this policy.

Changing the promise itself — adding a measured analytics product, say — is a decision for the
owner, stated in `README.md` and `AGENTS.md` in the same change as the code. It is never made by
an edit that only loosens a header.

## Verification

- `scripts/verify-dist.mjs` (run by `postbuild`): no third-party request, tracker, inline script or
  cookie write in the output.
- The CSP in `projects/shell/public/_headers` blocks at runtime what the scan misses.
