# `.claude/` — generated adapters and provider configuration

This directory is **not** where project rules are authored. Per
[`agents-md-schema.md`](https://github.com/exeris-systems/exeris-docs/blob/main/standards/agents-md-schema.md)
rules 2, 7 and 10-12, the canonical semantic source is [`.agents/`](../.agents) and this directory
adapts it for Claude Code.

- `agents/` — **generated** from `.agents/agents/<name>/AGENT.md`. The canonical profile declares
  `capabilities`; the renderer maps them onto this runtime's tool names.
- `skills/<name>/` — a **symlink** into `.agents/skills/<name>`, one per skill. Claude Code does
  not read `.agents/skills` natively, and a copy would be a second place a skill lives.
- `skills/<workflow>/SKILL.md` — **generated** from `.agents/workflows/<name>.md`, rendered
  `disable-model-invocation: true` so it stays user-invoked.
- `settings.json` — provider-owned, with a **generated region**: the renderer writes only the
  `hooks` key and merges around everything else. It is declared under `provider-owned` in
  [`.agents/manifest.yaml`](../.agents/manifest.yaml), because JSON has no comments to carry a
  marker.
- `settings.local.json` — provider-owned local configuration, git-ignored. Never semantic content.
- `worktrees/` — local git worktrees, git-ignored.

A change made to a generated file here is lost the next time the renderer runs.

## Hooks

`settings.json`'s `hooks` block invokes one dispatcher and carries no patterns of its own; the
patterns live in [`.agents/hooks/hooks.yaml`](../.agents/hooks/hooks.yaml) and are read at runtime.
Two shapes: a **deny** for actions no policy permits — a push to `main`, which deploys the site, and
an edit to `src/app/generated/` or `.agents/vendor/` — and a **record + gate** for actions a policy
permits with a consequence: an edit to copy or blocks is allowed, and the session's *stop* is held
until `npm run check:content` has run. Session state goes to `.agents-state/`, git-ignored and
keyed per session.

## Rendering and checking them

The renderer is **not** in this repository. ADR-085 §C.11 puts one implementation in
`exeris-systems/exeris-agents`, pinned in [`../.agents/manifest.yaml`](../.agents/manifest.yaml).
CI checks the bundle out and runs it; locally, from a checkout of that repository:

```bash
python3 tools/agents_bundle.py verify  --root <this repo>   # vendored digest matches the pin
python3 tools/agents_file_check.py     --root <this repo>   # schema rules 1-13
python3 tools/agents_render.py         --root <this repo>   # rewrite every adapter
python3 tools/agents_render.py --check --root <this repo>   # assert each matches its source
```
