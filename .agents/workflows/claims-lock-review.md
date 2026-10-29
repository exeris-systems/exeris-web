---
name: claims-lock-review
description: Decide whether a change in the benchmark claim register may be accepted into content/meta/claims.lock.json, by re-reading every page that quotes each changed claim. Use when the content check fails on a claim-lock mismatch, or before running npm run claims:lock.
argument-hint: The failing claim ids, or empty to compare src/data/claims.json against the lock
steps:
  - {agent: exeris-web-reviewer, skill: exeris-web-claims-review, gate: verdict}
  - {agent: exeris-web-implementer, when: "a page no longer reads true with the new claim string"}
gates: ["script:npm run check:content"]
output: schemas/verdict.schema.json
---

Decide whether the claim lock may be updated.

Claims: $ARGUMENTS

The lock exists so a change in the register cannot change a page's meaning without a person reading
the page. Running `npm run claims:lock` is the acceptance; this workflow is the reading that has to
come first.

1. **List the changed claims**: each id whose string in `src/data/claims.json` differs from
   `content/meta/claims.lock.json`, with the old and new strings side by side.
2. **For each, find every quotation**: view documents, `seo.json`, `src/content/`, the search index
   source.
3. **Re-read each quotation in its sentence.** Does the page still say something true with the new
   string — the same direction, a qualifier still present, no comparison overturned? Is the claim
   now retracted or no longer quotable alone?
4. **Decide.** `PASS` only if every quotation still reads true; then, and only then, the lock may be
   regenerated with `npm run claims:lock`. `CONDITIONAL` when a page needs its sentence changed
   first — hand it to `exeris-web-implementer`. `BLOCKED` when a quoted claim was retracted.
5. **Report** per claim: old string, new string, pages quoting it, verdict. Then the fenced `json`
   verdict.
