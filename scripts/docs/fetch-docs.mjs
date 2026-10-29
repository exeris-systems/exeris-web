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
import { isPublished, parseFrontmatter, renderDoc, routeOf } from './render.mjs';

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

/**
 * The pages of the docs site from `config` (sources.json) and a reader of raw files. Each listed
 * file must exist; one whose frontmatter is not public and active is left out and reported,
 * unless it is listed as a README.
 */
export async function buildDocs(config, { read, refs }) {
  const listed = [];
  for (const section of config.sections) {
    for (const item of section.files) {
      const entry = typeof item === 'string' ? item : item.file;
      const readme = typeof item === 'object' && item.readme === true;
      const [key, path] = entry.split(':');
      const source = config.sources[key];
      if (!source) throw new Error(`sources.json: ${entry} names no source ${key}`);
      if (readme && !/(^|\/)README\.md$/.test(path)) throw new Error(`sources.json: ${entry} is marked readme but is not a README`);
      listed.push({ section: section.id, key, path, source, readme });
    }
  }
  const files = [];
  const skipped = [];
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

  const pages = files.map((f) => {
    const ref = refs[f.key];
    const blob = (p) => `${GITHUB}/${f.source.repo}/blob/${ref}/${p}`;
    const { html, tree, headings, description } = renderDoc(f.body, { path: f.path, published: published.get(f.key), blob });
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

/** The generated files: index.json and index.ts (no content), one content module per page, routes.ts. */
export function writeGenerated(config, pages, refs) {
  rmSync(GENERATED, { recursive: true, force: true });
  const index = {
    refs,
    sections: config.sections.map((s) => ({ id: s.id, label: s.label })),
    pages: pages.map((p) => {
      const meta = { ...p };
      delete meta.html;
      delete meta.tree;
      return meta;
    }),
  };
  write('index.json', `${JSON.stringify(index, null, 2)}\n`);
  write('index.ts', `// Generated by scripts/docs/fetch-docs.mjs; do not edit.\nimport type { DocsIndex } from '../doc-types';\nimport index from './index.json';\n\nexport const DOCS_INDEX = index as DocsIndex;\n`);
  for (const p of pages) {
    write(`content/${p.id}.ts`, `// Generated by scripts/docs/fetch-docs.mjs; do not edit.\nimport type { DocNode } from '../../doc-types';\n\nexport const TREE: readonly DocNode[] = ${JSON.stringify(p.tree)};\n`);
  }
  const routes = pages.map(
    (p) => `  {\n    path: ${JSON.stringify(p.route)},\n    component: DocPageComponent,\n    data: { id: ${JSON.stringify(p.id)} },\n    resolve: { tree: () => import('./content/${p.id}').then((m) => m.TREE) },\n  },`,
  );
  write('routes.ts', `// Generated by scripts/docs/fetch-docs.mjs; do not edit.\nimport type { Routes } from '@angular/router';\nimport { DocPageComponent } from '../doc.page';\n\nexport const DOC_ROUTES: Routes = [\n${routes.join('\n')}\n];\n`);
}

async function main() {
  const config = JSON.parse(readFileSync(join(ROOT, 'projects/docs/sources.json'), 'utf8'));
  const refs = {};
  for (const [key, source] of Object.entries(config.sources)) refs[key] = await resolveRef(source);
  const read = (repo, ref, path) => getText(`${RAW}/${repo}/${ref}/${path}`);
  const { pages, skipped } = await buildDocs(config, { read, refs });
  writeGenerated(config, pages, refs);
  for (const s of skipped) console.warn(`fetch-docs: not published: ${s}`);
  console.log(`fetch-docs: ${pages.length} pages (${Object.entries(refs).map(([k, r]) => `${k} ${r.length === 40 ? r.slice(0, 7) : r}`).join(', ')})`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
