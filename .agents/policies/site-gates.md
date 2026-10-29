# Policy: The Gates Are Not Weakened

The site's promises are kept by programs as far as a program can see them: the content check,
the output verification, the determinism check, Lighthouse CI and the security headers. A change
that makes one of them pass by asking less of it removes the promise it enforces, silently. The
severity is `docs/repo-review-rules.md` S9.

## Hard Rules

1. **A threshold is not lowered, an allowlist not widened, a route not skipped** in
   `scripts/check-content.mjs`, `scripts/verify-dist.mjs`, `lighthouserc.json`, `public/_headers`
   or `.github/workflows/`, without the reason stated in the pull request.
2. **A check that enforces `public-claims`, `product-readiness` or `no-third-party-requests` is
   never removed.**
3. **The committed fallback does not publish.** `SITE_SKIP_FETCH=1` and the fetch-error fallback
   exist for offline builds; a path that deploys never sets the first, and never turns a parser or
   consistency failure into a fallback.
4. **A red gate is a finding or a defect in the gate.** Fix the change, or fix the gate in its own
   commit with its own reason — never relax it in the commit that needed it relaxed.
5. **The organisation's gates are the organisation's.** `guardrails.yml` calls
   `exeris-systems/.github`; a gate there is changed there, not disabled here.
6. **`GITHUB_TOKEN` goes to `api.github.com` only.** A fetch that sends it anywhere else is a
   credential leak.

## Verification

- The diff of the files named in rule 1, read by the reviewer; a green run of a weakened gate is
  not evidence.
