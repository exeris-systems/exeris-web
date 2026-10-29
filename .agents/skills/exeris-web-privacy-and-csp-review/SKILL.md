---
name: exeris-web-privacy-and-csp-review
description: Review whether a change to exeris.eu keeps the promise of no cookies, no analytics and no third-party requests, and leaves the Content-Security-Policy no looser than script-src 'self'. Use whenever a diff touches projects/shell/public/_headers, index.html, package.json dependencies, fonts or assets, styles that load resources, or any component code that could issue a browser request or store state.
---

# Exeris Web Privacy and CSP Review

## Purpose
Enforce `.agents/policies/no-third-party-requests.md`. `verify-dist.mjs` scans the built output and
the CSP blocks at runtime; this review catches what reaches neither — a dependency that will phone
home once configured, a header edit that makes the scan's job impossible.

## Procedure
1. **Origins.** Every URL the change can make the browser fetch: `src`, `href` on `link`, CSS
   `url()` and `@import`, `fetch`/`XMLHttpRequest`/`WebSocket`/`EventSource`, `navigator.sendBeacon`,
   `<iframe>`. Anything not same-origin → rule 1. An `<a href>` elsewhere is navigation, not a
   request (rule 6).
2. **State.** `document.cookie`, `localStorage`, `sessionStorage`, IndexedDB. A value that
   identifies a visitor → rule 2. A per-visitor preference that never leaves the browser is not
   tracking; say which it is.
3. **Analytics.** Any analytics, tag manager or beacon library, or a dependency that bundles one
   (rule 3).
4. **Inline code.** `<script>` without `src`, `on*=` attributes, `javascript:` URLs (rule 4).
5. **Headers.** Diff `projects/shell/public/_headers` directive by directive. Any addition of `unsafe-inline`,
   `unsafe-eval`, a host or a wildcard to a fetch directive, or a removed directive (rule 5).
6. **Dependencies.** For a new runtime dependency, check what it loads at runtime, not only its
   licence.
7. **Promise.** If the change is meant to alter the promise, `README.md` and `AGENTS.md` change in
   the same diff.

## Decision Logic
- **BLOCKED**: a third-party request, a cookie or tracking identifier, analytics, inline code, a
  loosened CSP.
- **CONDITIONAL**: the promise's wording in `README.md`/`AGENTS.md` changed without the code that
  keeps it, or code changed without the wording.
- **PASS**: no new origin, state, inline code or header loosening.

## Non-Negotiable Rules
- A header is never loosened to make a feature work. The feature changes, or the promise does —
  by the owner, in writing.
