---
title: "The docs site, docs.exeris.eu"
type: reference
visibility: public
owning-repo: exeris-web
status: active
last-verified: 2026-10-29
---

# The docs site

`projects/docs` is docs.exeris.eu. Its pages are the documentation of other repositories,
rendered when the site is built; this repository authors only the navigation, the home page and
the not-found page.

## What is published

`projects/docs/sources.json` lists every file the site may publish, grouped into the sections the
navigation shows, in order. A listed file is published only when its frontmatter says
`visibility: public` and `status: active`; any other listed file is left out and named in the
build log. A file that is not listed is never published, whatever its frontmatter, so a
repository's agent instructions or review rules do not appear on the site.

| Source | Repository | Read at | Route prefix |
|---|---|---|---|
| `kernel` | `exeris-kernel` | its latest release tag | `/kernel/` |
| `platform` | `exeris-docs` | the commit `main` points to | `/platform/` |

A page's route is its path in the repository without `docs/` and `.md`:
`exeris-kernel/docs/subsystems/memory.md` is `/kernel/subsystems/memory`.

## How a document is rendered

`npm run build:docs` runs `scripts/docs/fetch-docs.mjs`, which reads each listed file from
`raw.githubusercontent.com` at the ref above and writes `projects/docs/src/app/generated/` (not
committed): `index.json` with every page's title, description, section, contents and source, one
module of HTML per page, which the build turns into a chunk of its own, and the routes. There is
no committed copy, so a failed fetch fails the build. `scripts/docs/render.mjs` renders the
markdown:

- Headings get GitHub's anchor ids, numbered when a heading repeats, so links into a section of a
  document keep working. The contents beside a page list its second- and third-level headings.
- A relative link to another published document becomes its route, anchor kept; any other
  relative link goes to the file on GitHub at the ref the build read. Absolute links are kept.
- A Mermaid block is shown as its source, marked as a diagram.
- Raw HTML in the markdown is reduced to an allow-list of tags and attributes: no script, style
  element, image, frame, event handler or `javascript:` link survives. Angular's own sanitiser is
  bypassed for this HTML because it would drop the heading ids; the allow-list replaces it.
- The page title is the frontmatter `title`; the description is the first paragraph of at least
  40 characters, cut near 160.

The readiness word list of the site's own copy is not applied to the prose of these documents,
which are reviewed in their own repositories; it applies to what this repository writes for the
docs site.

## Pages and gates

Every page, the home page and the not-found page are prerendered with their own title,
description, canonical URL on `https://docs.exeris.eu` and Open Graph tags. `scripts/postbuild.mjs
docs` writes `404.html`, `sitemap.xml` and `robots.txt`; `scripts/verify-dist.mjs docs` checks
every route's tags and the no-tracking rules (see [Build gates](gates.md)). CI builds the docs on
every run with the repository's token.
