---
name: exeris-web-readiness-wording-review
description: Review whether copy on exeris.eu presents a capability or SKU as available, sold, supported, hosted or licensed for production only when the capability registry says it is released. Use whenever a diff touches page copy, a call to action, pricing, the SKUs page, sku-repos.json, readiness-allowlist.json, or src/data/caps.json and skus.json.
---

# Exeris Web Readiness Wording Review

## Purpose
Enforce `.agents/policies/product-readiness.md`. `READINESS_RULES` in
`scripts/check-content.mjs` rejects known phrases; a sentence can sell without one of them. This
review reads the sentence.

## Required Inputs
- The diff.
- `src/data/caps.json` and `src/data/skus.json` — the registry's `Status` per cap and per SKU.
- `content/meta/readiness-allowlist.json` and `content/meta/sku-repos.json`.

## Procedure
1. **List every sentence that speaks about availability** — what can be had, used, bought,
   deployed, supported, or asked about — and the item it is about.
2. **Look up the item's status.** A SKU's status is the lowest of its caps; an unlisted item is
   `poc` (rule 4).
3. **Read the sentence against the status.** For anything below `released`: does it say or imply
   sold, in production, supported, hosted, production-licensed or air-gappable? Does a price, call
   to action, "contact" route or install instruction presume it? (rules 1, 2)
4. **Check stated statuses.** A page naming a status names the registry's value exactly (rule 3).
5. **Allowlist entries.** One phrase, one rule, a reason, a technical use — never a sales sentence
   (rule 5).
6. **SKU cards.** An id added to `sku-repos.json` has a repository that exists (rule 6).

## Decision Logic
- **BLOCKED**: an unreleased item presented as available, or a CTA/price/install that presumes it;
  an allowlist entry that admits a sales sentence.
- **CONDITIONAL**: a status softened or upgraded in paraphrase.
- **PASS**: every availability sentence is true at the registry's status.

## Non-Negotiable Rules
- Judge the reading, not the vocabulary: "available today" fails beside `poc` without any banned
  word in it.
- The registry is the evidence. A maintainer's statement that something "ships soon" is not a status.
