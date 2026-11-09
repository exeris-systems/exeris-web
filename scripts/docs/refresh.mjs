#!/usr/bin/env node
// Rebuilds docs.exeris.eu when its sources moved on: compares the commits the live site was built
// from (its refs.json) with the refs the sources are read at now, and starts a Workers build
// through the docs Worker's deploy hook when a Markdown file changed between them. The docs read
// their sources at build time only, so a document merged upstream reaches the site this way or
// with the next push to this repository.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startBuild } from '../deploy-hook.mjs';
import { getJson } from '../fetch-data.mjs';
import { resolveRef } from './fetch-docs.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const API = 'https://api.github.com/repos/exeris-systems';
const LIVE_REFS = 'https://docs.exeris.eu/refs.json';
/** GitHub's compare API lists at most this many files; a longer change is taken to touch a document. */
const COMPARE_FILES = 300;

/**
 * Why the site needs a rebuild, one reason per source, or none. `deployed` is the live refs.json
 * (null when the live site has none); `current` the refs the sources resolve to now; `changed`
 * the paths changed between two commits of a repository, or null when GitHub cannot compare them.
 */
export async function staleSources(sources, deployed, current, changed) {
  if (!deployed) return ['the live site names no source commits'];
  const reasons = await Promise.all(Object.entries(sources).map(([key, source]) => staleReason(key, source, deployed[key], current[key], changed)));
  return reasons.filter(Boolean);
}

async function staleReason(key, source, from, to, changed) {
  if (from === to) return null;
  if (!from) return `${key}: not in the live site`;
  const paths = await changed(source.repo, from, to);
  if (!paths) return `${key}: ${from.slice(0, 7)}..${to.slice(0, 7)} cannot be compared`;
  if (paths.length >= COMPARE_FILES) return `${key}: ${paths.length} or more files changed`;
  const docs = paths.filter((p) => p.endsWith('.md'));
  return docs.length ? `${key}: ${docs.length} Markdown file(s) changed, ${docs[0]} first` : null;
}

async function liveRefs() {
  const res = await fetch(LIVE_REFS, { headers: { accept: 'application/json' } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`refresh: ${LIVE_REFS} answered ${res.status}`);
  return res.json();
}

async function changedPaths(repo, from, to) {
  try {
    const cmp = await getJson(`${API}/${repo}/compare/${from}...${to}`);
    return (cmp.files ?? []).map((f) => f.filename);
  } catch {
    // A commit the live site was built from may be gone (a force push) or unreachable.
    return null;
  }
}

async function main() {
  const force = process.argv.includes('--force');
  const dryRun = process.argv.includes('--dry-run');
  const { sources } = JSON.parse(readFileSync(join(ROOT, 'projects/docs/sources.json'), 'utf8'));
  const entries = Object.entries(sources);
  const refs = await Promise.all(entries.map(([, source]) => resolveRef(source)));
  const current = Object.fromEntries(entries.map(([key], i) => [key, refs[i]]));
  const reasons = force ? ['requested'] : await staleSources(sources, await liveRefs(), current, changedPaths);
  if (!reasons.length) {
    console.log('refresh: docs.exeris.eu is current; no Markdown file changed in its sources');
    return;
  }
  for (const r of reasons) console.log(`refresh: rebuild: ${r}`);
  if (dryRun) return;
  console.log(`refresh: ${await startBuild('DOCS_DEPLOY_HOOK', 'exeris-web-docs')}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
