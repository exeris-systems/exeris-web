// Parsers for the upstream sources the site is built from. Each parser takes the raw text of
// one source document and returns plain data; none of them touches the network or the disk,
// so the same functions run in fetch-data.mjs and in the tests.

const BENCHMARKS_BLOB = 'https://github.com/exeris-systems/exeris-benchmarks/blob/main/';
const BENCHMARKS_TREE = 'https://github.com/exeris-systems/exeris-benchmarks/tree/main/';

/** Resolves a link written relative to `docs/` of exeris-benchmarks into a GitHub URL. */
export function benchmarksUrl(relative) {
  const parts = ['docs'];
  for (const seg of relative.split('#')[0].split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.' && seg !== '') parts.push(seg);
  }
  const path = parts.join('/');
  const anchor = relative.includes('#') ? `#${relative.split('#')[1]}` : '';
  return (relative.endsWith('/') ? BENCHMARKS_TREE : BENCHMARKS_BLOB) + path + (relative.endsWith('/') ? '/' : '') + anchor;
}

/** The backtick-quoted segments of a markdown line, in order. */
function codeSpans(text) {
  return [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
}

/** The markdown links of a line as `{ label, url }`, label stripped of code ticks. */
function links(text) {
  return [...text.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map((m) => ({
    label: m[1].replace(/`/g, ''),
    url: benchmarksUrl(m[2]),
  }));
}

/**
 * Parses docs/CLAIMS.md of exeris-benchmarks.
 *
 * Every `### L<n>` block under "Registered claims" yields one entry per `- **copy…:**` line,
 * keyed `L<n>.<variant>`: the variant is the parenthesised label up to its first comma, as a
 * lower-case slug (`copy (TLS tax)` → `tls-tax`), or `copy` for an unqualified label. The copy is the line with its code
 * ticks removed, so a string split over several code spans keeps its connecting words verbatim;
 * a line with no code span ("none registered", "not quotable") is kept and marked not quotable.
 * The block's fence and source links are attached to every entry of the block.
 */
export function parseClaims(markdown) {
  const lines = markdown.split('\n');
  const claims = {};
  const withdrawn = [];
  const neverQuoteAlone = [];
  let section = '';
  let block = null;

  const blocks = {};
  for (const raw of lines) {
    const line = raw.trimEnd();
    const h2 = line.match(/^## (.+)$/);
    if (h2) {
      section = h2[1].trim();
      block = null;
      continue;
    }
    if (section === 'Registered claims') {
      const h3 = line.match(/^### (L\d+)$/);
      if (h3) {
        block = h3[1];
        blocks[block] = { entries: [], fence: null, sources: [] };
        continue;
      }
      if (!block) continue;
      const copy = line.match(/^- \*\*copy(?: \(([^)]+)\))?:\*\*\s*(.*)$/);
      if (copy) {
        const variant = (copy[1] ?? 'copy').split(',')[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const quotable = codeSpans(copy[2]).length > 0;
        const text = copy[2].replace(/`/g, '').trim();
        blocks[block].entries.push({ variant, quotable, copy: text, label: copy[1] ?? null });
        continue;
      }
      const fence = line.match(/^- \*\*fence:\*\*\s*(.*)$/);
      if (fence) {
        blocks[block].fence = fence[1].replace(/`/g, '').trim();
        continue;
      }
      const source = line.match(/^- \*\*source:\*\*\s*(.*)$/);
      if (source) {
        blocks[block].sources = links(source[1]);
      }
    } else if (section === 'Withdrawn') {
      const item = line.match(/^\d+\.\s+(.*)$/);
      if (item) withdrawn.push(item[1].trim());
    } else if (section === 'Never quote alone') {
      const item = line.match(/^- (.*)$/);
      if (item) neverQuoteAlone.push(item[1].replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/`/g, '').trim());
    }
  }
  for (const [id, b] of Object.entries(blocks)) {
    for (const entry of b.entries) {
      const key = `${id}.${entry.variant}`;
      if (claims[key]) throw new Error(`CLAIMS.md: duplicate claim key ${key}`);
      claims[key] = {
        id,
        variant: entry.variant,
        label: entry.label,
        quotable: entry.quotable,
        copy: entry.copy,
        fence: b.fence,
        sources: b.sources,
      };
    }
  }
  if (Object.keys(claims).length === 0) throw new Error('CLAIMS.md: no registered claims parsed');
  return { claims, withdrawn, neverQuoteAlone };
}

/**
 * Parses exeris-docs/cap-license-registry.md: one row per cap under each `### Layer N — Name`
 * table, plus the stated totals, which must agree with the rows.
 */
export function parseCapRegistry(markdown) {
  const caps = [];
  const layers = [];
  const stated = {};
  let layer = null;
  let inTotals = false;
  for (const raw of markdown.split('\n')) {
    const line = raw.trim();
    const h = line.match(/^### Layer (\d+) — (.+)$/);
    if (h) {
      layer = { n: Number(h[1]), name: h[2].trim() };
      layers.push(layer);
      inTotals = false;
      continue;
    }
    if (/^## /.test(line) || /^### /.test(line)) {
      inTotals = /^## Totals/.test(line);
      if (!/^### Layer/.test(line)) layer = null;
      continue;
    }
    const cells = line.startsWith('|') ? line.slice(1, -1).split('|').map((c) => c.trim()) : null;
    if (!cells) continue;
    if (inTotals && cells.length === 2) {
      const key = cells[0].replace(/[`*]/g, '');
      const n = Number(cells[1].replace(/\*/g, ''));
      if (Number.isFinite(n) && key) stated[key] = n;
      continue;
    }
    if (layer && cells.length === 4 && cells[0].startsWith('`exeris-caps-')) {
      const name = cells[0].replace(/`/g, '');
      const licenceRaw = cells[1].replace(/`/g, '');
      const licence = licenceRaw.split(' ')[0];
      caps.push({
        name,
        short: name.replace(/^exeris-caps-/, ''),
        layer: layer.n,
        layerName: layer.name,
        licence,
        licenceNote: licenceRaw === licence ? null : licenceRaw.slice(licence.length).trim().replace(/^\(|\)$/g, ''),
        visibility: cells[2],
        status: cells[3].replace(/\*/g, ''),
      });
    }
  }
  const totals = { community: 0, commercial: 0, 'enterprise-private': 0, total: caps.length };
  for (const cap of caps) {
    if (!(cap.licence in totals)) throw new Error(`cap registry: unknown licence ${cap.licence} on ${cap.name}`);
    totals[cap.licence] += 1;
  }
  for (const [key, n] of Object.entries(stated)) {
    if (totals[key] !== n) throw new Error(`cap registry: stated ${key} = ${n}, rows give ${totals[key]}`);
  }
  return {
    caps,
    layers: layers.map((l) => ({ ...l, count: caps.filter((c) => c.layer === l.n).length })),
    totals,
  };
}

/**
 * Parses the SKU composition table of exeris-docs/high-level-architecture.md §3.3 and the SKU
 * repository table of §6.3. Cap names are the code spans of the composition cell; anything else
 * in the cell (a SKU-specific cap without a registry row, a trailing note) is kept as text.
 */
export function parseSkus(markdown, capNames) {
  const known = new Set(capNames);
  const lines = markdown.split('\n');
  const start = lines.findIndex((l) => l.startsWith('### 3.3 '));
  const repoStart = lines.findIndex((l) => l.startsWith('### 6.3 '));
  if (start < 0 || repoStart < 0) throw new Error('HLA: §3.3 or §6.3 not found');

  const skus = [];
  for (let i = start + 1; i < lines.length && !lines[i].startsWith('## '); i++) {
    const m = lines[i].match(/^\| \*\*(.+?)\*\* \| (.+?) \| (.+?) \| (.+) \|$/);
    if (!m) continue;
    const name = m[1].trim();
    const compositionCell = m[4];
    const caps = codeSpans(compositionCell);
    const unknown = caps.filter((c) => !known.has(`exeris-caps-${c}`));
    if (unknown.length) throw new Error(`HLA §3.3 ${name}: caps not in the registry: ${unknown.join(', ')}`);
    const extra = compositionCell
      .replace(/`[^`]+`,?/g, '')
      .replace(/\([^)]*\)/g, (m) => (/SKU-specific/.test(m) ? m : ''))
      .split(/[,.]/)
      .map((s) => s.trim())
      .filter((s) => s && !/^L4 Flow saga engine/.test(s) && !/consumed via kernel SPI/.test(s));
    const note = /L4 Flow saga engine \(ADR-013\) consumed via kernel SPI/.test(compositionCell)
      ? 'L4 Flow saga engine (ADR-013) consumed via kernel SPI'
      : null;
    skus.push({
      name,
      family: m[2].trim(),
      closedSource: /Closed-source/i.test(m[3]),
      caps,
      skuSpecificCaps: extra,
      note,
    });
  }

  const repos = [];
  for (let i = repoStart + 1; i < lines.length && !lines[i].startsWith('### '); i++) {
    const m = lines[i].match(/^\| `(exeris-sku-[a-z-]+)` \| (\w+) \| (.+?) \|\s*(.*?)\s*\|$/);
    if (m) repos.push({ repo: m[1], licence: m[2], closedSource: /Closed-source/i.test(m[3]) });
  }
  const repoFor = (name) => {
    const slug = name.toLowerCase().replace(/headless cms api/, 'content-api').replace(/\s+/g, '-');
    return repos.find((r) => r.repo === `exeris-sku-${slug}`);
  };
  const result = skus.map((s) => {
    const repo = repoFor(s.name);
    if (!repo) throw new Error(`HLA §6.3: no repository row for SKU ${s.name}`);
    return {
      id: repo.repo.replace(/^exeris-sku-/, ''),
      repo: repo.repo,
      ...s,
      capCount: s.caps.length + s.skuSpecificCaps.length,
    };
  });
  if (result.length === 0) throw new Error('HLA §3.3: no SKU rows parsed');
  return result;
}

/** Median fields of one cold-start-ttfr result.json. */
export function parseColdStart(arm, json, env) {
  const s = json.startup;
  const pick = (k) => {
    if (!s[k] || typeof s[k].median !== 'number') throw new Error(`cold-start ${arm}: no median for ${k}`);
    return s[k].median;
  };
  return {
    arm,
    target: json.target.version,
    runId: json.run_id,
    claimScope: json.claim_scope,
    transport: json.transport_mode,
    tls: Boolean(json.tls?.enabled),
    executionVm: json.target.execution_vm,
    n: s.iterations,
    startupMs: pick('startup_ms'),
    ttfrMs: pick('ttfr_ms'),
    spawnToFirstRequestMs: pick('spawn_to_first_request_ms'),
    peakRssMb: pick('peak_rss_mb'),
    env: env
      ? {
          hardwareProfile: env.hardware_profile,
          cpu: env.cpu?.model ?? null,
          logicalThreads: env.cpu?.logical_threads ?? null,
          architecture: env.cpu?.architecture ?? null,
          jdkMajor: env.jdk?.major_version ?? null,
          os: env.os?.name ?? null,
        }
      : null,
  };
}

/**
 * Rows of the tJUG evidence bundle tables whose state is CITABLE, keyed by their figure label,
 * plus the bundle's front matter fields that fence them.
 */
export function parseEvidenceBundle(markdown) {
  const front = {};
  const fm = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (fm) {
    for (const line of fm[1].split('\n')) {
      const m = line.match(/^(claim_scope|hardware_profile|scenario|comparison_axis):\s*(.+)$/);
      if (m) front[m[1]] = m[2].trim();
    }
  }
  const rows = {};
  let segment = null;
  for (const line of markdown.split('\n')) {
    const h = line.match(/^## (Segment \d+)/);
    if (h) segment = h[1];
    const m = line.match(/^\| (.+?) \| (.+?) \| (.+?) \| (.+?) \|$/);
    if (!m || m[1] === 'figure' || /^-+$/.test(m[1])) continue;
    const state = m[4].replace(/\*/g, '').trim();
    if (!state.startsWith('CITABLE')) continue;
    const figure = m[1].replace(/\*/g, '').trim();
    rows[figure] = {
      figure,
      value: m[2].replace(/\*/g, '').trim(),
      artifact: m[3].replace(/`/g, '').trim(),
      state,
      segment,
    };
  }
  const scope = markdown.match(/\*\*Scope sentence that must be said aloud\.\*\*\s*([\s\S]*?)\n\n/);
  return { front, rows, scopeSentence: scope ? scope[1].replace(/\s+/g, ' ').trim() : null };
}
