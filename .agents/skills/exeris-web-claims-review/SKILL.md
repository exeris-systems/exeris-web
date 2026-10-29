---
name: exeris-web-claims-review
description: Review whether every figure the exeris.eu site prints is a registered benchmark claim quoted by id, with its qualifier, and not retracted. Use whenever a diff touches a view document's copy, content/meta/seo.json, src/content, a block template that renders numbers, claims.lock.json, number-allowlist.json or src/data/claims.json.
---

# Exeris Web Claims Review

## Purpose
Enforce `.agents/policies/public-claims.md`. The content check catches a numeric literal; it
cannot catch a figure written in words, a qualifier dropped in paraphrase, or a lock accepted
without reading. Those are this review's.

## Required Inputs
- The diff.
- `src/data/claims.json` (the committed register copy) and `content/meta/claims.lock.json`.
- The live `exeris-benchmarks/docs/CLAIMS.md` when a sibling checkout has it; otherwise say the live
  comparison was not made.

## Procedure
1. **Find every figure the change renders.** Numerals, written numbers ("twice", "a tenth"),
   ratios, percentages, and comparisons ("faster than", "lowest", "fewer").
2. **Bind each to a claim id.** A figure with no claim reference → rule 1. A comparison with none
   → rule 6.
3. **Check the quotation.** The page shows the register's string; an evidence excerpt is a
   verbatim part of its claim; a claim the register marks not quotable alone carries its
   qualifier (rule 2).
4. **Check retraction.** A claim in the register's retraction list quoted anywhere → rule 3.
5. **Lock changes.** A changed entry in `claims.lock.json` is accepted only if every page quoting
   that claim still reads true with the new string. Name each page and say whether it does (rule 4).
6. **Allowlist changes.** Each new `number-allowlist.json` entry is a non-measurement with a
   reason (rule 5).
7. **Colour.** `--ex-evidence` on anything that is not a claim figure (rule 7).

## Decision Logic
- **BLOCKED**: a typed, retracted or unqualified figure; a lock accepted without the pages re-read;
  a measurement allowlisted.
- **CONDITIONAL**: a superlative with no claim; evidence colour on a non-claim.
- **PASS**: every rendered figure resolves to a quotable claim, quoted as registered.

## Non-Negotiable Rules
- Never accept "the check is green" as evidence for a figure written in words.
- Never approve a regenerated lock on the strength of the regeneration.
