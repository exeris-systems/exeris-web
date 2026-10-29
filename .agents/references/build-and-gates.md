# Reference: Build and Gates

**Source:** `README.md` (§ Build, § Gates, § Cloudflare Pages) and `package.json` `scripts`. This
file names where to look and yields to them; a script's behaviour is what `package.json` and the
script say, not what is summarised here.

## Commands an agent runs

| Command | What it answers | Policy it serves |
|---|---|---|
| `npm ci` | dependencies at the lock | — |
| `npm run check:content` | claims, lock, numeric literals, readiness wording, SKU list, block map | `public-claims`, `product-readiness`, `view-ir-and-generated-output` |
| `npm run check:views` | two generations are byte-identical | `view-ir-and-generated-output` |
| `npm run lint` | ESLint | — |
| `npm test` | unit tests, including the content check | all of the above |
| `npm run build` | `prebuild` (data, generation, index, content check), `ng build`, `postbuild` (404, sitemap, robots, `verify-dist`) | `no-third-party-requests`, `view-ir-and-generated-output` |
| `npm run lighthouse` | Lighthouse CI against `dist/` | `site-gates` |

`SITE_SKIP_FETCH=1` builds from the committed `src/data/*.json` without the network — the right
setting for a local or sandboxed run. A sandbox that cannot run Chrome reports `npm run lighthouse`
as `not-run`, never as passing.

## What runs where

- **`.github/workflows/ci.yml`** — install, data, generation, content check, determinism, lint,
  tests, build, Lighthouse.
- **`.github/workflows/guardrails.yml`** — the organisation's docs lint (which runs the agent-file
  check), commit lint, pull-request body check, and the L2 review with `docs/repo-review-rules.md`
  as its repository extension. The required check is `review / verdict`.
- **Cloudflare Pages** — builds every push through its Git integration; `main` is production. There
  is no deploy job, so nothing between a push and a deploy can stop it.
