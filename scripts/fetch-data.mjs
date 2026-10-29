#!/usr/bin/env node
// Downloads the upstream sources the site is built from and writes them as JSON under
// src/data/. Runs before every build; the JSON is committed so an offline build works.
//
//   SITE_SKIP_FETCH=1   keep the committed JSON, fetch nothing
//   SITE_FETCH_STRICT=1 fail on a fetch error instead of falling back to the committed JSON
//   CF_PAGES=1          set by Cloudflare Pages: the build publishes, so it is strict as well
//   SITE_GITHUB_TOKEN   a token for api.github.com; GITHUB_TOKEN, which Actions provides, when unset
//
// Outside a publishing build, a fetch error (network failure, non-2xx status) falls back to the
// committed JSON, so a local or offline build works. A parser or
// consistency failure on content that did arrive always fails the build: falling back would ship
// stale claims, readiness and tooling versions behind a warning.
//
// The site's own commit SHA is written on every run (src/data/site-sha.json, not committed):
// it needs no network, and committing it would make every build dirty the tree.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseCapRegistry,
  parseClaims,
  parseColdStart,
  parseEvidenceBundle,
  parseMavenRelease,
  parseRepoReadme,
  parseSkus,
  sharedRelease,
  withSkuStatus,
} from './lib/parsers.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'src/data');
const RAW = 'https://raw.githubusercontent.com/exeris-systems';
const API = 'https://api.github.com/repos/exeris-systems';
const CENTRAL = 'https://repo1.maven.org/maven2';
const ORG_REPOS = 'https://api.github.com/orgs/exeris-systems/repos?type=public&per_page=100&page=';
const GITHUB = 'https://github.com/exeris-systems';

/** The tooling coordinates the Get started page shows; all are published under one group. */
export const TOOLING_GROUP = 'eu.exeris';
export const TOOLING_ARTIFACTS = ['exeris-initializr', 'exeris-app-parent', 'exeris-app-bom', 'exeris-app-starter'];

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

/** The upstream could not be reached or answered with an error status; the only fallback case. */
export class FetchError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'FetchError';
  }
}

/**
 * Request headers for `url`: the token goes to the GitHub API host only, never to a CDN or mirror.
 * The token is SITE_GITHUB_TOKEN, a name a secret store accepts where the GITHUB_ prefix is
 * reserved, or else GITHUB_TOKEN.
 */
export function headersFor(url, env = process.env) {
  const h = { 'User-Agent': 'exeris-web-build' };
  if (new URL(url).hostname === 'api.github.com') {
    h.Accept = 'application/vnd.github+json';
    const token = env.SITE_GITHUB_TOKEN || env.GITHUB_TOKEN;
    if (token) h.Authorization = `Bearer ${token}`;
  } else {
    h.Accept = '*/*';
  }
  return h;
}

async function request(url, method = 'GET') {
  let res;
  try {
    res = await fetch(url, { method, headers: headersFor(url) });
  } catch (err) {
    throw new FetchError(`${method} ${url}: ${err.message}`, { cause: err });
  }
  if (!res.ok) throw new FetchError(`${method} ${url}: HTTP ${res.status}`);
  return res;
}

async function getText(url) {
  return (await request(url)).text();
}

async function getJson(url) {
  return JSON.parse(await getText(url));
}

async function headSha(repo) {
  const commit = await getJson(`${API}/${repo}/commits/main`);
  return commit.sha;
}

/**
 * The names of the organisation's public repositories: one API call per hundred, so an
 * unauthenticated build stays far inside the rate limit. A repository this list does not hold is
 * private or absent, and the site links neither.
 */
async function publicRepos() {
  const names = new Set();
  for (let page = 1; ; page++) {
    const repos = await getJson(`${ORG_REPOS}${page}`);
    for (const r of repos) names.add(r.name);
    if (repos.length < 100) return names;
  }
}

/**
 * `repo` for a cap or SKU: its public repository and what its README says, or null. A README the
 * parser cannot read costs that card its sentence and version, not the build; a README that cannot
 * be fetched is a FetchError like any other.
 */
export async function repoOf(name, publicNames, readme, warn = console.warn) {
  if (!publicNames.has(name)) return null;
  const text = await readme(name);
  try {
    const { summary, builtAgainst } = parseRepoReadme(text);
    return { url: `${GITHUB}/${name}`, summary, builtAgainst };
  } catch (err) {
    warn(`fetch-data: ${name} README: ${err.message}; linking it without a summary`);
    return { url: `${GITHUB}/${name}`, summary: null, builtAgainst: null };
  }
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
  const skus = withSkuStatus(parseSkus(await docs('high-level-architecture.md'), registry.caps.map((c) => c.name)), registry.caps);

  const publicNames = await publicRepos();
  const readme = (name) => getText(`${RAW}/${name}/main/README.md`);
  for (const cap of registry.caps) cap.repo = await repoOf(cap.name, publicNames, readme);
  for (const sku of skus) sku.repo = await repoOf(`exeris-sku-${sku.id}`, publicNames, readme);

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

  // The version shown for the initializr is the release Maven Central lists for every coordinate
  // the page names, and the runnable jar must be there.
  const group = TOOLING_GROUP.replaceAll('.', '/');
  const releases = {};
  for (const artifact of TOOLING_ARTIFACTS) {
    releases[artifact] = parseMavenRelease(await getText(`${CENTRAL}/${group}/${artifact}/maven-metadata.xml`));
  }
  const toolingVersion = sharedRelease(releases);
  const jarUrl = `${CENTRAL}/${group}/exeris-initializr/${toolingVersion}/exeris-initializr-${toolingVersion}.jar`;
  // A 404 from Central means the shared release has no runnable jar: a consistency failure.
  try {
    await request(jarUrl, 'HEAD');
  } catch (err) {
    if (!(err instanceof FetchError) || !err.message.endsWith('HTTP 404')) throw err;
    throw new Error(`the initializr jar of the shared release is not on Maven Central: ${err.message}`, { cause: err });
  }

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
      tooling: {
        group: TOOLING_GROUP,
        version: toolingVersion,
        artifacts: TOOLING_ARTIFACTS,
        jarUrl,
        centralUrl: `https://central.sonatype.com/artifact/${TOOLING_GROUP}/exeris-initializr/${toolingVersion}`,
      },
      sources: { 'exeris-benchmarks': benchmarksSha, 'exeris-docs': docsSha },
    },
  };
}

/**
 * Whether a fetch error fails the build. A build that publishes never keeps the committed JSON:
 * it could be older than the registers it quotes, and the claims lock would pass against it.
 */
export function strictFetch(env = process.env) {
  return env.SITE_FETCH_STRICT === '1' || env.CF_PAGES === '1';
}

/**
 * Runs `fetchAll`; on a FetchError keeps the committed data (returns null) unless `strict` or
 * nothing is committed. Any other error is a parser or consistency failure and propagates.
 */
export async function loadUpstream(fetchAll, { strict, committed, warn = console.warn }) {
  try {
    return await fetchAll();
  } catch (err) {
    if (!(err instanceof FetchError) || strict || !committed) throw err;
    warn(`fetch-data: ${err.message}; keeping the committed data`);
    return null;
  }
}

async function main() {
  write('site-sha.json', { sha: siteSha() });

  if (process.env.SITE_SKIP_FETCH === '1') {
    console.log('fetch-data: SITE_SKIP_FETCH=1, keeping the committed data');
    return;
  }
  const files = await loadUpstream(fetchAll, {
    strict: strictFetch(),
    committed: existsSync(join(DATA, 'claims.json')),
  });
  if (!files) return;
  for (const [name, value] of Object.entries(files)) write(name, value);
  const meta = JSON.parse(readFileSync(join(DATA, 'build-meta.json'), 'utf8'));
  console.log(`fetch-data: claims ${Object.keys(files['claims.json'].claims).length}, caps ${files['caps.json'].totals.total}, SKUs ${files['skus.json'].skus.length}, kernel ${meta.kernel.tag}, tooling ${meta.tooling.version}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(`fetch-data: ${err.message}`);
    process.exit(1);
  });
}
