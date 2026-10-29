# Policy: Readiness Is Read From the Registry

What the site says about whether something can be had is true only as far as
`exeris-docs/cap-license-registry.md` says it is. The registry's `Status` column (`poc`,
`snapshot`, `released`) is the evidence, read at build time into `src/data/caps.json` and
`src/data/skus.json`. The mechanics are `docs/gates.md` § Readiness wording; the severity is
`docs/repo-review-rules.md` S2.

## Hard Rules

1. **Only `released` is sold.** Copy that says or implies an item is sold, in production,
   supported, hosted, licensed for production or air-gappable is permitted only for an item whose
   registry `Status` is `released`. For `poc`, `snapshot` or an item the registry does not list,
   that sentence — and any price, call to action, "contact sales" route or install instruction that
   presumes it — does not ship.
2. **The reading decides, not the word.** "Available today" beside a `poc` capability fails;
   "a proof of concept, not yet released" does not. A phrase that passes the check is not thereby
   permitted.
3. **A stated status is the registry's value.** A page that names a status names the registry's,
   neither softened nor upgraded in paraphrase.
4. **A SKU is as ready as its least ready cap**, and a SKU-specific cap with no registry row counts
   as `poc`. Readiness is never assumed.
5. **The readiness allowlist is one phrase, one rule, one reason.** An entry in
   `content/meta/readiness-allowlist.json` is a legitimate technical use of a gated word (a
   capability's own name, a licence's name), optionally scoped to one view. It is never a way to
   ship a sales sentence early.
6. **A SKU card needs a repository.** `content/meta/sku-repos.json` lists an id only once the
   repository exists.

## Verification

- `npm run check:content`: `READINESS_RULES`, the released-SKU exemption, the allowlist and the SKU
  list.
- The sentence around a phrase the check accepts is the reviewer's, under S2.
