#!/usr/bin/env node
// Reads the documents projects/docs/sources.json lists from their repositories, renders the
// published ones and writes the docs application's generated tree (projects/docs/src/app/generated,
// not committed): an index of every page, one module per page holding its document tree, so each
// page is its own lazily loaded chunk, and the routes. Each source is read at the ref
// sources.json gives it: the commit `main` points to, or the latest release tag.
//
// There is no committed copy to fall back to: a fetch error fails the build.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getJson, getText } from '../fetch-data.mjs';
import { isPublished, orgTarget, parseFrontmatter, renderDoc, resolvePath, routeOf } from './render.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
export const GENERATED = join(ROOT, 'projects/docs/src/app/generated');
const API = 'https://api.github.com/repos/exeris-systems';
const RAW = 'https://raw.githubusercontent.com/exeris-systems';
const GITHUB = 'https://github.com/exeris-systems';

/** The ref a source is read at: the commit `main` points to, or the latest release tag. */
async function resolveRef(source) {
  if (source.ref === 'release') return (await getJson(`${API}/${source.repo}/releases/latest`)).tag_name;
  if (source.ref === 'main') return (await getJson(`${API}/${source.repo}/commits/main`)).sha;
  throw new Error(`sources.json: unknown ref ${source.ref} for ${source.repo}`);
}

/** A record or a standard under a directory: Markdown, and not an ADR link stub. */
const isDocument = (path) => path.endsWith('.md') && !path.endsWith('.link.md');
/** The records an ADR registry links to: ADRs and RFCs. */
const isRecord = (path) => isDocument(path) && /(^|\/)(adr|rfc)\/[^/]+$/.test(path);

/**
 * The pages of the docs site from `config` (sources.json), a reader of raw files and a lister of a
 * repository's files at a ref. A section lists files by path, a directory (`dir`: every Markdown
 * file under it, a README first), or a registry (`registry`: every ADR and RFC the file links to, in
 * its order, through a relative link or an organisation URL at the ref its source is read at). A
 * file listed twice belongs to the first section that lists it. Each file named by path must exist;
 * one whose frontmatter is not public and active is left out and reported, unless it is listed as
 * a README.
 */
export async function buildDocs(config, { read, refs, list = async () => [] }) {
  const byRepo = new Map(Object.entries(config.sources).map(([k, src]) => [src.repo, k]));
  const refsOf = (repo) => {
    const key = byRepo.get(repo);
    return key ? [...new Set([config.sources[key].ref, refs[key]])].filter((r) => r && r !== 'release') : [];
  };
  const sourceOf = (entry) => {
    const [key, path] = entry.split(':');
    const source = config.sources[key];
    if (!source) throw new Error(`sources.json: ${entry} names no source ${key}`);
    return { key, path, source };
  };

  const listed = [];
  const skipped = [];
  const seen = new Set();
  const add = (section, key, path, readme = false) => {
    if (seen.has(`${key}:${path}`)) return;
    seen.add(`${key}:${path}`);
    listed.push({ section, key, path, source: config.sources[key], readme });
  };
  for (const section of config.sections) {
    for (const item of section.files) {
      if (typeof item === 'object' && item.dir) {
        const { key, path, source } = sourceOf(item.dir);
        const under = (await list(source.repo, refs[key])).filter((p) => p.startsWith(`${path}/`) && isDocument(p));
        under.sort((a, b) => Number(!a.endsWith('/README.md')) - Number(!b.endsWith('/README.md')) || a.localeCompare(b));
        if (!under.length) throw new Error(`sources.json: ${item.dir} holds no Markdown file`);
        for (const p of under) add(section.id, key, p);
        continue;
      }
      if (typeof item === 'object' && item.registry) {
        const { key, path, source } = sourceOf(item.registry);
        const { body } = parseFrontmatter(await read(source.repo, refs[key], path));
        let elsewhere = 0;
        for (const [, href] of body.matchAll(/\]\(([^)\s]+)\)/g)) {
          const org = /^[a-z][a-z0-9+.-]*:/i.test(href) ? orgTarget(href, refsOf) : undefined;
          const target = org
            ? { key: byRepo.get(org.repo), path: org.path }
            : /^[a-z][a-z0-9+.-]*:|^#/i.test(href)
              ? undefined
              : { key, path: resolvePath(path, decodeURIComponent(href.split('#')[0])) };
          if (target && isRecord(target.path)) add(section.id, target.key, target.path);
          else if (!target && /\/blob\/.+\.md(#.*)?$/.test(href) && !href.endsWith('.link.md')) elsewhere++;
        }
        if (elsewhere) skipped.push(`${item.registry}: ${elsewhere} links to records at another ref or in a repository that is not a source`);
        continue;
      }
      const entry = typeof item === 'string' ? item : item.file;
      const readme = typeof item === 'object' && item.readme === true;
      const { key, path } = sourceOf(entry);
      if (readme && !/(^|\/)README\.md$/.test(path)) throw new Error(`sources.json: ${entry} is marked readme but is not a README`);
      add(section.id, key, path, readme);
    }
  }
  const files = [];
  for (const f of listed) {
    const { data, body } = parseFrontmatter(await read(f.source.repo, refs[f.key], f.path));
    // A README carries no frontmatter; listed as one, it is as public as its repository, which the
    // build reads without credentials.
    if (!f.readme && !isPublished(data)) {
      skipped.push(`${f.key}:${f.path} (visibility ${data.visibility ?? 'unset'}, status ${data.status ?? 'unset'})`);
      continue;
    }
    files.push({ ...f, data, body, route: routeOf(f.source.route, f.path) });
  }
  // A route is one page: `docs/README.md` and `README.md` of one source would both be its root.
  const byRoute = new Map();
  for (const f of files) {
    const other = byRoute.get(f.route);
    if (other) throw new Error(`sources.json: ${other.key}:${other.path} and ${f.key}:${f.path} are both /${f.route}`);
    byRoute.set(f.route, f);
  }
  const published = new Map(Object.keys(config.sources).map((k) => [k, new Map()]));
  for (const f of files) published.get(f.key).set(f.path, f.route);

  // An organisation URL to a published document is followed on the site when it names the ref the
  // source is configured with (`main`) or the commit or tag the build resolved that to.
  const site = { refs: refsOf, route: (repo, path) => published.get(byRepo.get(repo))?.get(path) };

  const pages = files.map((f) => {
    const ref = refs[f.key];
    const blob = (p) => `${GITHUB}/${f.source.repo}/blob/${ref}/${p}`;
    const { html, tree, headings, description } = renderDoc(f.body, { path: f.path, published: published.get(f.key), blob, site });
    // A title is shown as plain text in the navigation, the contents and <title>.
    const title = (f.data.title || headings.find((h) => h.level === 1)?.text || f.path).replace(/`/g, '');
    return {
      id: f.route.replace(/\//g, '--'),
      route: f.route,
      section: f.section,
      title,
      description,
      source: { repo: f.source.repo, ref, path: f.path, url: blob(f.path) },
      headings: headings.filter((h) => h.level === 2 || h.level === 3),
      html,
      tree,
    };
  });
  return { pages, skipped };
}

function write(name, text) {
  const file = join(GENERATED, name);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
}

/**
 * The generated files: index.json and index.ts, which every page loads, with each page's metadata
 * and the text of its headings as search keywords; one content module per page, loaded with the
 * page, holding its tree and its headings with their ids; routes.ts.
 */
export function writeGenerated(config, pages, refs) {
  rmSync(GENERATED, { recursive: true, force: true });
  const index = {
    refs,
    sections: config.sections.map((s) => ({ id: s.id, label: s.label })),
    pages: pages.map((p) => {
      const meta = { ...p, keywords: p.headings.map((h) => h.text).join(' ') };
      delete meta.html;
      delete meta.tree;
      delete meta.headings;
      return meta;
    }),
  };
  write('index.json', `${JSON.stringify(index, null, 2)}\n`);
  write('index.ts', `// Generated by scripts/docs/fetch-docs.mjs; do not edit.\nimport type { DocsIndex } from '../doc-types';\nimport index from './index.json';\n\nexport const DOCS_INDEX = index as DocsIndex;\n`);
  for (const p of pages) {
    write(`content/${p.id}.ts`, `// Generated by scripts/docs/fetch-docs.mjs; do not edit.\nimport type { DocHeading, DocNode } from '../../doc-types';\n\nexport const TREE: readonly DocNode[] = ${JSON.stringify(p.tree)};\n\nexport const HEADINGS: readonly DocHeading[] = ${JSON.stringify(p.headings)};\n`);
  }
  const routes = pages.map(
    (p) => `  {\n    path: ${JSON.stringify(p.route)},\n    component: DocPageComponent,\n    data: { id: ${JSON.stringify(p.id)} },\n    resolve: { doc: () => import('./content/${p.id}').then((m) => ({ tree: m.TREE, headings: m.HEADINGS })) },\n  },`,
  );
  write('routes.ts', `// Generated by scripts/docs/fetch-docs.mjs; do not edit.\nimport type { Routes } from '@angular/router';\nimport { DocPageComponent } from '../doc.page';\n\nexport const DOC_ROUTES: Routes = [\n${routes.join('\n')}\n];\n`);
}

async function main() {
  const config = JSON.parse(readFileSync(join(ROOT, 'projects/docs/sources.json'), 'utf8'));
  const refs = {};
  for (const [key, source] of Object.entries(config.sources)) refs[key] = await resolveRef(source);
  const read = (repo, ref, path) => getText(`${RAW}/${repo}/${ref}/${path}`);
  const list = async (repo, ref) => (await getJson(`${API}/${repo}/git/trees/${ref}?recursive=1`)).tree.filter((t) => t.type === 'blob').map((t) => t.path);
  const { pages, skipped } = await buildDocs(config, { read, refs, list });
  writeGenerated(config, pages, refs);
  for (const s of skipped) console.warn(`fetch-docs: not published: ${s}`);
  console.log(`fetch-docs: ${pages.length} pages (${Object.entries(refs).map(([k, r]) => `${k} ${r.length === 40 ? r.slice(0, 7) : r}`).join(', ')})`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
