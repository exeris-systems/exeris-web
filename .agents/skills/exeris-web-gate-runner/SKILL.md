---
name: exeris-web-gate-runner
description: Run the exeris.eu site's mechanical gates in order and report each by exit code — content check, determinism, lint, tests, build with output verification, Lighthouse. Use before handing a change off, before opening a pull request, or when asked whether the site builds and passes.
---

# Exeris Web Gate Runner

## Purpose
Turn "it should pass" into exit codes. The commands and what each checks are in
`.agents/references/build-and-gates.md`; this skill is the order and the reporting discipline.

## Procedure
1. **Dependencies.** `npm ci` if `node_modules` is missing or `package-lock.json` changed.
2. **Data.** Use `SITE_SKIP_FETCH=1` unless the task is about the registers. Say which was used:
   a build from committed data proves nothing about the live registers.
3. **Gates**, in order, each its own command so each has its own exit code:
   1. `npm run check:content`
   2. `npm run check:views`
   3. `npm run lint`
   4. `npm test`
   5. `npm run build`
   6. `npm run lighthouse`
4. **Keep going after a failure** unless a later gate depends on the failed one (`lighthouse`
   needs `build`). One red gate does not make the others unknown.
5. **Report.** Per gate: `pass`, `fail` with the first failing message verbatim, or `not-run` with
   the reason (no Chrome, no network, depends on a failed gate).

## Non-Negotiable Rules
- Never chain gates with `&&` into one command: the exit code then belongs to none of them.
- Never edit a file, a threshold or an allowlist to turn a gate green.
- Never report a gate that did not run as passing.
