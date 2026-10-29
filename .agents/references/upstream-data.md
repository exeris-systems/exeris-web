# Reference: Upstream Data

**Source:** `README.md` § Build-time data and `scripts/fetch-data.mjs`. The registers themselves
are authoritative in their owning repositories; `src/data/*.json` is their committed copy.

| Committed copy | Authoritative register | Owning repository |
|---|---|---|
| `src/data/claims.json` | `docs/CLAIMS.md` | `exeris-benchmarks` |
| `src/data/cold-start.json` | `results/cold-start-ttfr/` (the L14 arms) | `exeris-benchmarks` |
| `src/data/saga-v2.json` | the CITABLE contract-v2 rows of the evidence bundle | `exeris-benchmarks` |
| `src/data/caps.json` | `cap-license-registry.md` | `exeris-docs` |
| `src/data/skus.json` | `high-level-architecture.md` §3.3, §6.3, plus the lowest readiness of the SKU's caps | `exeris-docs` |
| `src/data/build-meta.json` | the latest kernel release; tooling on Maven Central | `exeris-kernel`, `exeris-tooling` |

## Consequences for an agent

- A wrong figure or status is corrected **in the register**, then re-fetched. Editing the committed
  JSON by hand forks the site from its evidence.
- A diff that changes `src/data/*.json` is a register change arriving here; read the register's
  own change before reading the page that quotes it.
- A sandbox without a sibling checkout cannot read the live register. A rule that can only be
  settled there is reported as unchecked, not as passing.
- Versions in copy are tokens (`{tooling.version}`, `{kernel.version}`), never literals.
