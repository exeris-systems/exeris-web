---
title: "Build-time data of exeris.eu"
type: reference
visibility: public
owning-repo: exeris-web
status: active
last-verified: 2026-10-29
---

# Build-time data

`scripts/fetch-data.mjs` reads, from the `main` branch of each repository:

| File | Source |
|---|---|
| `src/data/claims.json` | `exeris-benchmarks/docs/CLAIMS.md`, registered copy strings keyed `L12.absolute`, `L13.floor`, … |
| `src/data/cold-start.json` | `exeris-benchmarks/results/cold-start-ttfr/<arm>/20260626T104113Z-n8-res/result.json`, medians for the five arms of L14 |
| `src/data/caps.json` | `exeris-docs/cap-license-registry.md`: licence, visibility, `Build` state and readiness `Status` (`poc`, `snapshot` or `released`) per cap, read by header name |
| `src/data/skus.json` | `exeris-docs/high-level-architecture.md` §3.3 and §6.3, plus `status`: the lowest readiness of the SKU's caps |
| `src/data/saga-v2.json` | the CITABLE contract-v2 rows of the tJUG evidence bundle in `exeris-benchmarks` |
| `src/data/build-meta.json` | the latest `exeris-kernel` release, the version of the tooling published on Maven Central and the source commits |

`content/meta/sku-repos.json` lists the SKUs that have a repository. The SKUs page shows a card for
each of them and names every other SKU of the registry as planned; `check-content` fails on a listed
id the registry does not hold and on a card for an id the list does not name. Add an id only when
the repository exists.

Readiness is read from the registry's `Status` column by header name. The older four-column
layout, whose fourth `Status` column holds the build state, is still accepted and reads as `poc`.
A missing column, an empty cell or an unknown value is `poc`, the lowest value: readiness is never
assumed. A SKU is as ready as the least ready cap in it; a SKU-specific cap, which has no registry
row, counts as `poc`.

The tooling version on the Get started page and in the hero is not typed into the content. The
fetch reads Maven Central's `maven-metadata.xml` for `exeris-initializr`, `exeris-app-parent`,
`exeris-app-bom` and `exeris-app-starter`, requires them to agree on one release, checks that the
runnable jar exists, and writes the result to `build-meta.json`. Copy and code samples name it as
`{tooling.version}` (the latest kernel release as `{kernel.version}`); the check fails on any other
version literal.

The JSON is committed, so an offline build works. `SITE_SKIP_FETCH=1` keeps it without fetching;
a fetch error (network failure or HTTP status) falls back to it unless `SITE_FETCH_STRICT=1` or
`CF_PAGES=1`, which Cloudflare Pages sets: the publishing build fails rather than publish the
committed copy, which may be older than the registers it quotes, and the previous deployment stays
live. A
parser or consistency failure (a duplicate claim key, an unknown licence, tooling artefacts on
different releases, a missing initializr jar, a missing CITABLE row) always fails the build.
`GITHUB_TOKEN`, when set, is sent to `api.github.com` only, never to Maven Central or
`raw.githubusercontent.com`.
