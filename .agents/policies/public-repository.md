# Policy: A Public Repository Publishes Every Line

This repository is public, and so is its history: a force-push does not withdraw what a push
published. Everything committed has the right to be public, the licence statements match the files
they describe, the brand is used as shipped, and the language is English. The severities are
`docs/repo-review-rules.md` S6, S7 and S8.

## Hard Rules

1. **Nothing internal.** No private repository's name, internal decision identifier, local
   filesystem path, hostname or account from a maintainer's machine, credential, unreleased
   customer or partner name, working note, or process marker ("draft", "awaiting approval") in a
   committed file, a commit message or a pull-request body. Public ADR numbers and public
   repository names are not internal.
2. **The licence split holds.** Source code is Apache-2.0 (`LICENSE`); site copy and brand assets
   are all rights reserved (`LICENSE-CONTENT`). A page, the footer, the README, a package field or
   a header states a licence exactly as the file it points at, and a change to one statement
   changes its siblings.
3. **Nothing is imported under an incompatible licence** — copy, an asset, or a dependency whose
   licence conflicts with the Apache-2.0 source.
4. **The open-source list is checked, not assumed.** `OPEN_SOURCE_REPOS` in `src/content/site.ts`
   names a repository only once it is public on GitHub and its `LICENSE` carries the Apache-2.0
   text.
5. **Brand assets are the brand kit's files.** The mark, lockups, icons and social card in
   `projects/shell/assets/brand/` are used as shipped — never recoloured, redrawn or re-exported.
   Brand colour values live in `projects/shell/styles/brand.css` and nowhere else.
6. **English** in every committed artefact.

## Verification

- No program checks rules 1-5 exhaustively; they are the reviewer's. Rule 1 is checked against the
  whole diff and the pull request's text, because removing a line in a later commit does not
  unpublish it.
