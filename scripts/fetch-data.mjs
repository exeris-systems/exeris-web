#!/usr/bin/env node
// Downloads the upstream sources the site is built from and writes them as JSON under
// src/data/. Runs before every build; the JSON is committed so an offline build works.
//
//   SITE_SKIP_FETCH=1   keep the committed JSON, fetch nothing
//   SITE_FETCH_STRICT=1 fail on a network error instead of falling back to the committed JSON
//
// The site's own commit SHA is written on every run (src/data/site-sha.json, not committed):
// it needs no network, and committing it would make every build dirty the tree.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCapRegistry, parseClaims, parseColdStart, parseEvidenceBundle, parseSkus } from './lib/parsers.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'src/data');
const RAW = 'https://raw.githubusercontent.com/exeris-systems';
const API = 'https://api.github.com/repos/exeris-systems';

/** The cold-start campaign and the five arms the L14 comparison string names, in its order. */
export const COLD_START_RUN = '20260626T104113Z-n8-res';
export const COLD_START_ARMS = [
  { arm: 'exeris-community-nocrypto', label: 'Exeris Community', qualifier: 'crypto subsystem off', exeris: true },
  { arm: 'quarkus-tuned', label: 'Quarkus (hand-tuned JDBC)', qualifier: 'JVM mode' },
  { arm: 'quarkus-hibernate-cleartext', label: 'Quarkus + Hibernate', qualifier: 'JVM mode' },
  { arm: 'spring-on-exeris', label: 'Spring on Exeris', qualifier: 'compatibility mode' },
  { arm: 'spring-hibernate', label: 'Spring Boot + Hibernate', qualifier: 'Tomcat' },
];

/** The contract-v2 saga rows the Lab quotes; each must be CITABLE in the evidence bundle. */
export const SAGA_BUNDLE = 'results/reports/2026-08-22-tjug-talk-evidence.md';
export const SAGA_FIGURES = [
  'server-backed arm, ceiling',
  'serverless arm, ceiling',
  'serverless arm has no external engine',
  'Axon Server, post-load resident',
];

function headers() {
  const h = { 'User-Agent': 'exeris-web-build', Accept: 'application/vnd.github+json' };
  const token = process.env.GITHUB_TOKEN;
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function getText(url) {
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new Error(`GET ${url}: HTTP ${res.status}`);
  return res.text();
}

async function getJson(url) {
  return JSON.parse(await getText(url));
}

async function headSha(repo) {
  const commit = await getJson(`${API}/${repo}/commits/main`);
  return commit.sha;
}

function write(name, value) {
  mkdirSync(DATA, { recursive: true });
  writeFileSync(join(DATA, name), `${JSON.stringify(value, null, 2)}\n`);
}

function siteSha() {
  const fromEnv = process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA;
  if (fromEnv) return fromEnv;
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

async function fetchAll() {
  const [benchmarksSha, docsSha] = await Promise.all([headSha('exeris-benchmarks'), headSha('exeris-docs')]);
  const benchmarks = (path) => getText(`${RAW}/exeris-benchmarks/${benchmarksSha}/${path}`);
  const docs = (path) => getText(`${RAW}/exeris-docs/${docsSha}/${path}`);

  const claimsMd = await benchmarks('docs/CLAIMS.md');
  const claims = parseClaims(claimsMd);

  const registry = parseCapRegistry(await docs('cap-license-registry.md'));
  const skus = parseSkus(await docs('high-level-architecture.md'), registry.caps.map((c) => c.name));

  const arms = [];
  for (const def of COLD_START_ARMS) {
    const base = `results/cold-start-ttfr/${def.arm}/${COLD_START_RUN}`;
    const result = JSON.parse(await benchmarks(`${base}/result.json`));
    const env = JSON.parse(await benchmarks(`${base}/env.json`));
    arms.push({ ...def, ...parseColdStart(def.arm, result, env), path: `${base}/result.json` });
  }

  const bundle = parseEvidenceBundle(await benchmarks(SAGA_BUNDLE));
  const sagaRows = SAGA_FIGURES.map((figure) => {
    const row = bundle.rows[figure];
    if (!row) throw new Error(`${SAGA_BUNDLE}: no CITABLE row "${figure}"`);
    return row;
  });

  const release = await getJson(`${API}/exeris-kernel/releases/latest`);

  return {
    'claims.json': {
      source: { repo: 'exeris-benchmarks', commit: benchmarksSha, path: 'docs/CLAIMS.md' },
      claims: claims.claims,
      withdrawn: claims.withdrawn,
      neverQuoteAlone: claims.neverQuoteAlone,
    },
    'caps.json': {
      source: { repo: 'exeris-docs', commit: docsSha, path: 'cap-license-registry.md' },
      ...registry,
    },
    'skus.json': {
      source: { repo: 'exeris-docs', commit: docsSha, path: 'high-level-architecture.md §3.3, §6.3' },
      skus,
    },
    'cold-start.json': {
      source: { repo: 'exeris-benchmarks', commit: benchmarksSha, path: `results/cold-start-ttfr/*/${COLD_START_RUN}/result.json` },
      run: COLD_START_RUN,
      statistic: 'median',
      arms,
    },
    'saga-v2.json': {
      source: { repo: 'exeris-benchmarks', commit: benchmarksSha, path: SAGA_BUNDLE },
      front: bundle.front,
      scopeSentence: bundle.scopeSentence,
      rows: sagaRows,
    },
    'build-meta.json': {
      kernel: { tag: release.tag_name, url: release.html_url, publishedAt: release.published_at },
      sources: { 'exeris-benchmarks': benchmarksSha, 'exeris-docs': docsSha },
    },
  };
}

async function main() {
  write('site-sha.json', { sha: siteSha() });

  if (process.env.SITE_SKIP_FETCH === '1') {
    console.log('fetch-data: SITE_SKIP_FETCH=1, keeping the committed data');
    return;
  }
  let files;
  try {
    files = await fetchAll();
  } catch (err) {
    const committed = existsSync(join(DATA, 'claims.json'));
    if (process.env.SITE_FETCH_STRICT === '1' || !committed) throw err;
    console.warn(`fetch-data: ${err.message}; keeping the committed data`);
    return;
  }
  for (const [name, value] of Object.entries(files)) write(name, value);
  const meta = JSON.parse(readFileSync(join(DATA, 'build-meta.json'), 'utf8'));
  console.log(`fetch-data: claims ${Object.keys(files['claims.json'].claims).length}, caps ${files['caps.json'].totals.total}, SKUs ${files['skus.json'].skus.length}, kernel ${meta.kernel.tag}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(`fetch-data: ${err.message}`);
    process.exit(1);
  });
}
