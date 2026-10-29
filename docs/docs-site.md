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
build log. An entry marked `readme` is the one exception: a README carries no frontmatter and is
as public as its repository, which the build reads without credentials, so a README of a private
repository cannot be read at all. An entry marked `readme` must be a `README.md`. A file that is
not listed is never published, whatever its frontmatter, so a repository's agent instructions or
review rules do not appear on the site.

| Source | Repository | Read at | Route prefix |
|---|---|---|---|
| `kernel` | `exeris-kernel` | the commit `main` points to | `/kernel/` |
| `sdk` | `exeris-sdk` | the commit `main` points to | `/sdk/` |
| `tooling` | `exeris-tooling` | the commit `main` points to | `/tooling/` |
| `platform` | `exeris-docs` | the commit `main` points to | `/platform/` |

Until the 1.0 releases the site follows `main`, so a fix to a document is published by the next
build, and each page names the commit it was read at. From 1.0 the kernel, SDK and tooling are
read at their release tags, with one version of the site per release; there is no versioning
before then, because the 0.x releases would all need their own.

A page's route is its path in the repository without `docs/` and `.md`:
`exeris-kernel/docs/subsystems/memory.md` is `/kernel/subsystems/memory`. A README is its
directory: `exeris-sdk/README.md` is `/sdk`, `exeris-sdk/exeris-sdk-tck/README.md` is
`/sdk/exeris-sdk-tck`.

## How a document is rendered

`npm run build:docs` runs `scripts/docs/fetch-docs.mjs`, which reads each listed file from
`raw.githubusercontent.com` at the ref above and writes `projects/docs/src/app/generated/` (not
committed): `index.json` with every page's title, description, section, contents and source, one
module per page holding its document tree, which the build turns into a chunk of its own, and the
routes. There is
no committed copy, so a failed fetch fails the build. `scripts/docs/render.mjs` renders the
markdown:

- Headings get GitHub's anchor ids, numbered when a heading repeats, so links into a section of a
  document keep working. The contents beside a page list its second- and third-level headings.
- A relative link to another published document becomes its route, anchor kept; any other
  relative link goes to the file on GitHub at the ref the build read. An absolute link of the form
  `https://github.com/exeris-systems/<repo>/blob/<ref>/<path>`, the form the documentation
  standards prescribe between repositories, becomes the route of `<path>` when `<repo>` is a source,
  `<path>` is published and `<ref>` is the ref the source is read at (`main`) or the commit or tag
  it resolved to. Any other absolute link is kept.
- A Mermaid block is drawn as a diagram in the browser: `mermaid.component.ts` loads Mermaid from
  this site, only on a page that has a diagram, renders it with `securityLevel: "strict"` one
  diagram at a time, and appends the SVG as parsed nodes. The prerendered page, a browser without
  JavaScript and a diagram Mermaid cannot parse show the source instead.
- A link the sanitiser left empty, such as a README badge whose image was removed, is dropped.
- Raw HTML in the markdown is reduced to an allow-list of tags and attributes: no script, style
  element, image, frame, event handler or `javascript:` link survives.
- The sanitised HTML is turned into a tree of elements and text (`toTree`), and the page draws it
  with an Angular template (`doc-content.component.ts`) that has a case for each allowed tag. No
  HTML string reaches the browser and nothing bypasses Angular's sanitising: attributes are bound
  one by one, and links go through Angular's URL sanitiser. A test fails when the allow-list names
  a tag the template does not draw.
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
