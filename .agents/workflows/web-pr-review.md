---
name: web-pr-review
description: Full pull-request review for exeris-web — what the change makes the site say and load, the View IR pipeline, the gates, ending in a verdict. Run it locally before opening a pull request. CI reviews with the organisation's shared routine and `docs/repo-review-rules.md`, which holds CI's review to the same policies.
argument-hint: PR number, diff, or the list of changed files
steps:
  - {agent: exeris-web-router, skill: exeris-web-task-classifier}
  - {agent: exeris-web-reviewer, gate: verdict}
  - {agent: exeris-web-verification, skill: exeris-web-gate-runner, when: "the pull request's checks have not run on its head commit"}
gates: [ci:*]   # every check run on the pull request, read from it — not a list maintained here
output: schemas/verdict.schema.json
---

Review the change below and return one verdict.

Change: $ARGUMENTS

If that is empty, review the working branch's diff against `main`, and say which you reviewed.

Read `AGENTS.md` first, then the policies the diff touches. Each policy is the single owner of its
list and names the document it yields to; a summary repeated here would go stale.

What makes this review different from a code review: the site is the public statement of what
Exeris is, measures and offers. The characteristic defect is a sentence — a figure typed instead of
quoted, a proof of concept described as available — and it passes every type check.

Steps:

1. **Triage** with `exeris-web-task-classifier`. The class decides which skills the review needs; a
   change to `projects/shell/public/_headers` does not need the claims pass.

2. **Record what the mechanical checks said**, before reading the diff for meaning. Read the pull
   request's own check runs and report each by the name and conclusion it reports. A check that has
   not finished, or that you could not read, is `not-run`. With no pull request, run
   `exeris-web-gate-runner` and report its exit codes instead.

3. **The site's promises**, through `exeris-web-reviewer` and the skills the class selects:
   `exeris-web-claims-review`, `exeris-web-readiness-wording-review`,
   `exeris-web-privacy-and-csp-review`, `exeris-web-view-ir-review`; and the `public-repository`
   and `site-gates` policies, which have no skill because they are read, not procedured.

4. **Correctness.** Read the diff for defects, not only for policy breaches: wrong logic, a broken
   route, an edge case, a reference to a file the change deletes. **A defect found here is a
   blocking finding whose `why` is `.agents/workflows/web-pr-review.md#correctness`** — this rule
   is the clause. A broken page does not merge because no policy forbade that page in particular.

5. **Scope.** Does the diff match the pull-request title and description? Name what is in scope and
   missing, and what is out of scope and should be split.

6. **Report.** Blockers first, then in-scope improvements, then suggestions, each with `file:line`
   and what breaks. End with the verdict and the same content as a fenced `json` block conforming
   to `.agents/schemas/verdict.schema.json`.

Two things are absolute regardless of size: a figure not bound to a claim id is `BLOCKED`, and so
is a gate that was not run reported as though it had been.
