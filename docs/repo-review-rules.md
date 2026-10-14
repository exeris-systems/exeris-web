---
title: "Review rules for exeris-web"
type: reference
visibility: public
owning-repo: exeris-web
status: active
last-verified: 2026-10-14
---

# Review rules for `exeris-web`

The `repo-routine` extension of `exeris-systems/.github`'s `docs-guardrails-review.md`, applied
**after** its parts and under its severity tags, output format and verdict schema. It adds checks
and raises severities; it lowers nothing and skips nothing. One review, one verdict, one publisher.
A finding cites a rule of this file as `repo-review-rules.md#S<n>`.

**The criteria are not authored here.** They are stated by this repository's `AGENTS.md` and
`README.md`, by the licence files, and by the build that enforces them. This file names the
questions a reviewer must reach for and the severity each answer carries; where a rule restates a
sentence of those documents, the document is the one to read and to change.

## What this repository is answerable for

`exeris-web` is the public site of the Exeris platform, an Angular application prerendered into
static files and served by Cloudflare Pages. It has no server, and what it says is the public
statement of what Exeris is, what it measures and what can be had. A sentence on a page is read as
a promise by a buyer and as a citation by everyone else, so the shared `code` part, which judges
whether a change is correct, cannot know which sentences this site may print. That is what follows.

## Step S — rules of this repository

S1. **Every figure in copy is bound to a claim id, and none is retracted.** A number, ratio or
    comparison in a page, in `content/meta/seo.json` or in any string rendered to a visitor comes
    from a registered claim of the benchmarks repository's `docs/CLAIMS.md`, referenced by its id
    (for example `L12.absolute`) and quoted as the register states it. A figure typed into copy; a
    claim that is not quotable on its own, shown without the qualifier its register entry requires;
    a claim the register's retraction register withdraws, quoted again, in a page, a title or a
    description; an entry added to `content/meta/number-allowlist.json` or a regenerated
    `claims.lock.json` that accepts a changed claim string without the page having been re-read
    against it → `[HARD BLOCK]`. A superlative or comparison ("faster than", "lowest") with no
    claim id behind it → `[CONTRACT]`.

S2. **Product readiness is a claim, and the registry is its evidence.** Copy that says or implies
    that an item is sold, in production, supported, hosted, licensed for production or
    air-gappable is true only for an item whose `Status` in `exeris-docs/cap-license-registry.md`
    is `released`. For an item at `poc` or `snapshot`, or one the registry does not list, such a
    sentence, and any call to action, price, "contact sales" route or install instruction that
    presumes it, is `[HARD BLOCK]`. This is judged on the reading of the sentence, not on the
    presence of a word: "available today" beside a `poc` capability fails, and "a proof of
    concept, not yet released" does not. A page that states a status must state the registry's
    value; a status softened or upgraded in paraphrase → `[CONTRACT]`. The build's content check
    covers the cases a program can see, so a green check is evidence for those and not for the
    sentence around them.

S3. **Pages are View IR, and generated output is not patched.** A page is a
    `content/views/view_<name>.json` document read by `@exeris/codegen-ts` into
    `src/app/generated/`, with its SEO entry in `content/meta/seo.json`. A diff that edits
    `src/app/generated/` or its `.exeris-codegen-manifest`, commits that tree, or reaches the same
    visible result by a component that bypasses the document for a page the IR can express →
    `[HARD BLOCK]`. A gap in what the generator emits is a change to `exeris-tooling`, named in
    the pull request; a workaround in this repository that stays → `[CONTRACT]`. A `CUSTOM` block
    that does not go through the registry in `src/app/blocks` → `[CONTRACT]`.

S4. **The site sets no cookie, runs no analytics and makes no third-party request.** In a diff: a
    cookie write, `localStorage` used as a tracking identifier, an analytics or tag-manager
    snippet, an external font, script, image, stylesheet or frame host, a runtime request to
    another origin, an inline script or inline event handler, or a `public/_headers` edit that
    loosens the Content-Security-Policy below `script-src 'self'` (an `unsafe-inline`,
    `unsafe-eval`, a host, a wildcard) → `[HARD BLOCK]`. A new link that merely navigates to
    another site is not a request and is judged by S7. A change to the promise in `README.md` or
    `AGENTS.md` without the code that keeps it → `[CONTRACT]`.

S5. **Every route carries its own metadata.** A route added or renamed has a view document, an
    entry in `content/meta/seo.json` and, through the build, its own HTML with a unique title, a
    description, a canonical URL on `https://exeris.eu`, Open Graph and Twitter tags and an `h1`;
    the 404 page is `noindex`. A route missing any of these, a canonical that differs from the
    route, a title shared with another route, or a route that lacks an entry in the sitemap
    source → `[CONTRACT]`. A description or title that restates a figure falls under S1.

S6. **Nothing internal in a public repository.** Every path in the diff has the right to be
    public: a private repository's name, an internal decision identifier, a local filesystem
    path, a hostname or account from the maintainer's machine, a credential, an unreleased
    customer or partner name, a working note, or a process marker such as "draft" or "awaiting
    approval" in a published file → `[HARD BLOCK]`. Public ADR numbers and public repository names
    are not internal. A force-push does not undo a publication, so the finding stands even when
    the line is removed in a later commit of the same pull request.

S7. **Licence statements match the files they describe.** Source code is Apache-2.0 (`LICENSE`);
    site copy and brand assets are all rights reserved (`LICENSE-CONTENT`). A page, the footer,
    the README, a package field or a header that states a licence differently from the file it
    points at, copy or an asset imported under a licence that `LICENSE-CONTENT` does not
    allow, or a dependency whose licence conflicts with the Apache-2.0 source split →
    `[HARD BLOCK]`. A licence stated for a product capability must equal the registry's value for
    it, and a statement of what a licence permits in production is also S2. A change to one
    licence statement and not to its siblings → `[CONTRACT]`.

S8. **Brand assets are used, not redrawn, and the language is English.** The mark, lockups, icons
    and social card are the shipped files of the brand kit; a recoloured, redrawn or
    re-exported copy → `[CONTRACT]`. A committed artefact in a language other than English →
    `[CONTRACT]`.

S9. **The gates are not weakened.** A change to `scripts/check-content.mjs`,
    `scripts/verify-dist.mjs`, `lighthouserc.json`, `public/_headers` or the workflows that lowers
    a threshold, widens an allowlist, skips a route, or adds `SITE_SKIP_FETCH` or a fallback to a
    path that publishes, with no stated reason in the pull request → `[CONTRACT]`; the same change
    that removes a check which enforces S1, S2 or S4 → `[HARD BLOCK]`.

## Where this does not apply, and what it costs

The shared `code` and `pr` parts judge correctness, scope, the pull request's body and its
commits, and the rules above are not a second copy of them. Whether a component is well written
is the `code` part's; what this file adds is the list of promises this site's own documents make,
which a generic review cannot know to look for. Comments and prose in documents fall to the shared
`code-docs` part and the documentation lint.

The cost is that these rules are prose a reviewer applies, not a program. The reviewer reads the
diff, not the registers: the claim register and the capability registry live in other
repositories, and `src/data/*.json` is their committed copy. A rule that can only be settled by
reading the live register, or by running the build or the Lighthouse run, is reported as unchecked,
not as passing. Whether a figure is the right one to put on a page is an editorial choice for
the owner, and no rule here decides it.
