# Policy: Every Figure Is a Registered Claim

The site is the public statement of what Exeris measures. A number on a page is read as a promise
by a buyer and as a citation by everyone else, so it has one source: the claim register of
`exeris-benchmarks` (`docs/CLAIMS.md`), read at build time into `src/data/claims.json`. How the
check that enforces this works is in `docs/gates.md`; the severity a reviewer gives a breach is
`docs/repo-review-rules.md` S1.

## Hard Rules

1. **A figure is quoted by claim id, never typed.** A number, ratio or comparison rendered to a
   visitor — in a view document, `content/meta/seo.json`, `src/content/` or a block's own
   template — comes from a claim reference such as `L12.absolute` and is shown as the register
   states it.
2. **A claim keeps its qualifier.** A claim the register marks as not quotable on its own is shown
   with the qualifier its entry requires, or not at all.
3. **A retracted claim is never quoted again**, in a page, a title or a description.
4. **The lock is accepted, not regenerated.** `content/meta/claims.lock.json` changes only after
   each changed claim string has been re-read against every page that quotes it — the
   `claims-lock-review` workflow. Running `npm run claims:lock` to make a red build green is the
   breach this rule exists for.
5. **The number allowlist names a source.** An entry added to
   `content/meta/number-allowlist.json` is a literal that is not a measurement (a year, a port, a
   version placeholder), with the reason. A measurement is never allowlisted.
6. **A superlative needs a claim.** "Faster than", "lowest", "fewest" with no claim id behind it is
   a comparison typed into copy.
7. **Evidence Orange is for claims.** `--ex-evidence` colours only a figure bound to a claim id.

## Verification

- `npm run check:content` (also run by `prebuild` and as a unit test): claim existence,
  quotability, verbatim evidence excerpts, the lock, and the numeric-literal scan.
- What a program cannot see — a figure in prose that reads as a measurement, a qualifier dropped in
  paraphrase — is the reviewer's, under S1.
