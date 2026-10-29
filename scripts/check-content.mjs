#!/usr/bin/env node
// Content gate. Fails when
//  - a page references a claim key that claims.json does not hold, or one registered as not
//    quotable;
//  - an evidence excerpt is not a verbatim part of its claim's copy;
//  - the copy of a claim a page uses differs from content/meta/claims.lock.json (the register
//    changed a string the site quotes: review the page, then `npm run claims:lock`);
//  - a numeric literal appears in content/ or src/content/ outside a claim reference, a URL or
//    an entry of content/meta/number-allowlist.json;
//  - a view names an unknown CUSTOM block, gives children to a block that does not lay them out,
//    uses an unknown structural-count token or lacks an SEO entry;
//  - authored copy uses readiness or commercial wording (see READINESS_RULES below) outside an
//    allow-listed technical use or the copy of a released SKU;
//  - a SKU card names an id the SKU registry lacks, or a SKU with a public repository has no card;
//  - the README summary of a public cap repository, which its card shows, uses readiness wording;
//  - exeris-codegen.json customBlocks does not map a CUSTOM block to a component file that exports it.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const readJson = (p) => JSON.parse(read(p));

/** Keys whose string value is not prose: links, claim references and their excerpts. */
const NON_PROSE_KEYS = new Set(['href', 'claim', 'excerpt', 'id', 'sku', 'tone', 'variant', 'kind', 'size', 'lang']);
/** Keys whose value may be a JSON number: layout only. */
const NUMBER_KEYS = new Set(['columns']);
const COUNT_TOKEN = /\{([a-z.:-]+)\}/g;
const COUNT_KEYS = /^(caps\.(total|community|commercial|enterprise-private)|caps\.status:[a-z]+|skus\.status:[a-z]+|layers|licences|skus|sku\.caps:[a-z-]+|tooling\.version|kernel\.version)$/;

/**
 * Readiness and commercial wording. Nothing is released as a product today, so copy that says a
 * thing is sold, supported, hosted or licensed for production, or invites a sales conversation,
 * says something untrue. Each rule has an id, which an entry of content/meta/readiness-allowlist.json
 * names to permit one technical use.
 */
export const READINESS_RULES = [
  { id: 'sold', re: /\b(sold|sell|sells|selling|sale|sales)\b/i },
  { id: 'buy', re: /\b(buy|buyer|buyers|buying|bought)\b/i },
  { id: 'purchase', re: /\bpurchas(e|es|ed|ing)\b/i },
  { id: 'production', re: /\bproduction\b/i },
  { id: 'support', re: /\b(production|commercial|enterprise|paid|premium|priority|long-term|self)[- ]support(ed)?\b|\bsupport (contract|plan|tier|team|offering)s?\b|\band support\b/i },
  { id: 'sla', re: /\bSLAs?\b/ },
  { id: 'cve', re: /\bCVEs?\b/ },
  { id: 'hosted', re: /\b(hosted|managed) (control plane|service|platform|console|version|offering|cloud|option)\b|\bSaaS\b/i },
  { id: 'control-plane', re: /\bcontrol plane\b/i },
  { id: 'licence', re: /\b(production|runtime|perpetual|commercial|enterprise)[- ](use )?licen[cs]e\b|\blicen[cs]e (key|fee)s?\b|\bExeris (Commercial|Enterprise) License\b|\bsubscri(be|bed|ption|ptions)\b|\bone-time fee\b/i },
  { id: 'air-gapped', re: /\bair-?gap(ped|pable)?\b|\bon-prem(ises)?\b/i },
  { id: 'contact-sales', re: /\bContact (us|sales)\b|\bDiscuss (Enterprise )?fit\b|\b(request|book) a demo\b|\bget a quote\b/i },
  { id: 'console', re: /console\.exeris\.eu/i },
];

/** Keys whose value is a link: the rules that name an address still apply to it. */
const LINK_KEYS = new Set(['href']);

/** The readiness rules a piece of copy trips, after the allow-listed uses are taken out. */
export function readinessHits(text, { view = null, allow = [], isLink = false } = {}) {
  const hits = [];
  for (const rule of READINESS_RULES) {
    if (isLink && rule.id !== 'console') continue;
    const allowed = allow.filter((e) => e.rule === rule.id && (!e.view || e.view === view));
    let probe = text;
    for (const e of allowed) probe = probe.replace(new RegExp(e.pattern, 'gi'), ' ');
    const m = probe.match(rule.re);
    if (m) hits.push({ rule: rule.id, match: m[0] });
  }
  return hits;
}

function readinessAllowlist() {
  return readJson('content/meta/readiness-allowlist.json').entries;
}

/**
 * Readiness errors of one view. Copy attached to a SKU whose status is `released` is exempt: a
 * node that names the SKU in `sku`, or an element of a `skus` list with that `id`. Everything
 * else, site-wide copy included, is held to the rules.
 */
export function viewReadinessErrors(file, view, { skus, allow }) {
  const released = new Set(skus.filter((s) => s.status === 'released').map((s) => s.id));
  const errors = [];
  const scan = (value, key, where, exempt) => {
    if (exempt || typeof value !== 'string') return;
    for (const h of readinessHits(value, { view: view.name, allow, isLink: LINK_KEYS.has(key) })) {
      errors.push(`${file}: ${where}: "${h.match}" reads as ${h.rule}; nothing is released as a product (see "Readiness wording" in docs/gates.md)`);
    }
  };
  const walk = (value, key, where, exempt) => {
    if (Array.isArray(value)) value.forEach((v, i) => walk(v, key, `${where}[${i}]`, key === 'skus' && v && released.has(v.id) ? true : exempt));
    else if (value && typeof value === 'object') {
      const own = exempt || (typeof value.sku === 'string' && released.has(value.sku));
      for (const [k, v] of Object.entries(value)) walk(v, k, `${where}.${k}`, own);
    } else if (!NON_PROSE_KEYS.has(key) || LINK_KEYS.has(key)) scan(value, key, where, exempt);
  };
  // Every node type is held to the rules: a CUSTOM block's props are JSON, a RICH_TEXT node's are
  // the prose itself. The children of a block attached to a released SKU share its exemption.
  const visit = (nodes, path, exempt) =>
    (nodes ?? []).forEach((node, i) => {
      const at = `${path}[${i}]`;
      let own = exempt;
      if (node.props) {
        let props;
        try {
          props = JSON.parse(node.props);
        } catch {
          // a CUSTOM block whose props are not JSON is reported by the main check
          props = node.type === 'CUSTOM' ? undefined : node.props;
        }
        if (props && typeof props === 'object') {
          own = exempt || (typeof props.sku === 'string' && released.has(props.sku));
          walk(props, null, `${at} props`, exempt);
        } else if (typeof props === 'string') scan(props, null, `${at} props`, exempt);
      }
      visit(node.children, `${at}.children`, own);
    });
  scan(view.title ?? '', 'title', 'title', false);
  (view.regions ?? []).forEach((region, r) => visit(region.components, `regions[${r}].components`, false));
  return errors;
}

/**
 * The SKU cards against the registry: a card names a SKU of the registry, and every SKU whose
 * repository is public (`repo` in skus.json, from the organisation's public repositories) has a
 * card, so its description is authored before the page shows it. A card for a SKU whose repository
 * is not public stays unrendered until it is.
 */
export function skuCardErrors({ skus, views }) {
  const errors = [];
  const registry = new Set(skus.map((s) => s.id));
  const carded = new Set();
  for (const { file, json } of views) {
    (json.view.regions ?? []).forEach((region, r) =>
      walkNodes(region.components, (node, at) => {
        if (node.type !== 'CUSTOM' || node.customType !== 'ExSkuCards' || !node.props) return;
        let props;
        try {
          props = JSON.parse(node.props);
        } catch {
          return;
        }
        (props.skus ?? []).forEach((c, i) => {
          carded.add(c.id);
          if (!registry.has(c.id)) errors.push(`${file} regions[${r}]${at} props.skus[${i}]: a SKU card for "${c.id}", which is not a SKU of the registry (skus.json)`);
        });
      }, '.components'),
    );
  }
  for (const s of skus) {
    if (s.repo && !carded.has(s.id)) errors.push(`src/data/skus.json: "${s.id}" has a public repository and no SKU card; write its description in an ExSkuCards block`);
  }
  return errors;
}

/** Readiness wording in what a public repository says about itself, which a cap card shows. */
export function repoSummaryErrors({ caps, allow }) {
  const errors = [];
  for (const c of caps) {
    if (!c.repo?.summary) continue;
    for (const h of readinessHits(c.repo.summary, { allow })) {
      errors.push(`src/data/caps.json: the README summary of ${c.name}: "${h.match}" reads as ${h.rule}; the cap card would show it (see "Readiness wording" in docs/gates.md)`);
    }
  }
  return errors;
}

function walkDir(dir) {
  return readdirSync(join(ROOT, dir)).flatMap((f) => {
    const p = `${dir}/${f}`;
    return statSync(join(ROOT, p)).isDirectory() ? walkDir(p) : [p];
  });
}

export function loadViews() {
  return readdirSync(join(ROOT, 'content/views'))
    .filter((f) => f.startsWith('view_') && f.endsWith('.json'))
    .sort()
    .map((file) => ({ file: `content/views/${file}`, json: readJson(`content/views/${file}`) }));
}

function customBlockNames() {
  const src = read('src/app/blocks/names.ts');
  const list = (name) => {
    const m = src.match(new RegExp(`${name}[^=]*=\\s*\\[([^\\]]*)\\]`));
    return m ? [...m[1].matchAll(/'([A-Za-z]+)'/g)].map((x) => x[1]) : [];
  };
  return { all: new Set(list('CUSTOM_BLOCKS')), withChildren: new Set(list('BLOCKS_WITH_CHILDREN')) };
}

function allowlist() {
  return readJson('content/meta/number-allowlist.json').entries.map((e) => new RegExp(e.pattern, 'gi'));
}

/**
 * Numeric literals left in `text` once URLs, site paths, template placeholders, count tokens and
 * allow-listed phrases are removed. A digit inside a word (`B2B`, `i18n`) is part of a name, not
 * a number.
 */
export function strayNumbers(text, patterns = allowlist()) {
  let rest = text
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\$\{[^}]*\}\S*/g, ' ')
    .replace(/(^|\s)\/[\w\-/#]*/g, ' ')
    .replace(COUNT_TOKEN, ' ');
  for (const re of patterns) rest = rest.replace(re, ' ');
  return [...rest.matchAll(/(?<![A-Za-z_\d])\d+(?:[.,:]\d+)*/g)].map((m) => m[0]);
}

function walkNodes(nodes, visit, path) {
  (nodes ?? []).forEach((node, i) => {
    const here = `${path}[${i}]`;
    visit(node, here);
    walkNodes(node.children, visit, `${here}.children`);
  });
}

/** Every value under `value`, with its key and path, for the prose and claim checks. */
function walkProps(value, visit, path, key = null) {
  if (Array.isArray(value)) value.forEach((v, i) => walkProps(v, visit, `${path}[${i}]`, key));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) walkProps(v, visit, `${path}.${k}`, k);
  } else visit(value, path, key);
}

/**
 * Numeric-literal and count-token errors of one CUSTOM block's props. Claim references are handed
 * to `useClaim`, which checks them against the register; every other string that is not under a
 * NON_PROSE_KEYS key is prose.
 */
export function propsNumberErrors(props, at, { patterns = allowlist(), useClaim = () => {} } = {}) {
  const errors = [];
  walkProps(props, (value, p, key) => {
    const where = `${at} props${p}`;
    if (typeof value === 'number' && !NUMBER_KEYS.has(key)) errors.push(`${where}: numeric literal ${value}`);
    if (typeof value !== 'string') return;
    if (key === 'claim' || key === 'claims' || (key === null && /\.claims\[\d+\]$/.test(p))) {
      useClaim(value, where);
      return;
    }
    if (NON_PROSE_KEYS.has(key)) return;
    if (key !== 'code') {
      for (const m of value.matchAll(COUNT_TOKEN)) {
        if (!COUNT_KEYS.test(m[1])) errors.push(`${where}: unknown count token {${m[1]}}`);
      }
    }
    for (const s of strayNumbers(value, patterns)) errors.push(`${where}: numeric literal "${s}"`);
  }, '');
  return errors;
}

export function checkContent({ lock = readJson('content/meta/claims.lock.json') } = {}) {
  const errors = [];
  const claims = readJson('src/data/claims.json').claims;
  const seo = readJson('content/meta/seo.json');
  const blocks = customBlockNames();
  const patterns = allowlist();
  const used = new Set();

  const useClaim = (key, where) => {
    const c = claims[key];
    if (!c) return errors.push(`${where}: claim ${key} is not in claims.json`);
    if (!c.quotable) return errors.push(`${where}: claim ${key} is registered as not quotable`);
    used.add(key);
    return c;
  };

  for (const { file, json } of loadViews()) {
    const v = json.view;
    if (!seo[v.name]) errors.push(`${file}: no entry for "${v.name}" in content/meta/seo.json`);
    for (const s of strayNumbers(`${v.title ?? ''}`, patterns)) errors.push(`${file}: numeric literal "${s}" in the title`);
    (v.regions ?? []).forEach((region, r) =>
      walkNodes(region.components, (node, where) => {
        const at = `${file} regions[${r}]${where}`;
        if (node.type === 'CUSTOM') {
          if (!blocks.all.has(node.customType)) errors.push(`${at}: unknown CUSTOM block ${node.customType}`);
          if (node.children?.length && !blocks.withChildren.has(node.customType)) errors.push(`${at}: ${node.customType} does not lay out children`);
          let props;
          try {
            props = node.props ? JSON.parse(node.props) : {};
          } catch (e) {
            errors.push(`${at}: props are not JSON (${e.message})`);
            return;
          }
          errors.push(...propsNumberErrors(props, at, { patterns, useClaim }));
          // Excerpts: each object holding claim + excerpt must quote the claim verbatim.
          const excerptCheck = (value, p) => {
            if (Array.isArray(value)) value.forEach((x, i) => excerptCheck(x, `${p}[${i}]`));
            else if (value && typeof value === 'object') {
              if (typeof value.claim === 'string' && typeof value.excerpt === 'string') {
                const c = claims[value.claim];
                if (c && !c.copy.includes(value.excerpt)) errors.push(`${at} props${p}: excerpt "${value.excerpt}" is not part of ${value.claim}`);
              }
              for (const [k, x] of Object.entries(value)) excerptCheck(x, `${p}.${k}`);
            }
          };
          excerptCheck(props, '');
        } else if (node.props) {
          for (const s of strayNumbers(node.props, patterns)) errors.push(`${at}: numeric literal "${s}"`);
        }
      }, `.components`),
    );
  }

  // Readiness wording: every view, the site-wide content and the meta files.
  const skusData = readJson('src/data/skus.json').skus;
  const allow = readinessAllowlist();
  for (const { file, json } of loadViews()) errors.push(...viewReadinessErrors(file, json.view, { skus: skusData, allow }));
  errors.push(...skuCardErrors({ skus: skusData, views: loadViews() }));
  errors.push(...repoSummaryErrors({ caps: readJson('src/data/caps.json').caps, allow }));
  const siteScan = (file, text, where, isLink) => {
    for (const h of readinessHits(text, { allow, isLink })) errors.push(`${file}${where}: "${h.match}" reads as ${h.rule}; nothing is released as a product (see "Readiness wording" in docs/gates.md)`);
  };
  for (const file of ['content/meta/seo.json', 'content/meta/index-extra.json']) {
    walkProps(readJson(file), (value, p, key) => {
      if (typeof value === 'string') siteScan(file, value, p, key === 'href');
    }, '');
  }

  // No component or public file links the Console, whatever the copy says.
  const sources = [...walkDir('src/app').filter((f) => f.endsWith('.ts') && !f.startsWith('src/app/generated/')), ...walkDir('public')];
  for (const file of sources) {
    if (/console\.exeris\.eu/i.test(read(file))) errors.push(`${file}: links console.exeris.eu; the console is not a live offering`);
  }

  // src/content: string literals of the typed site content.
  for (const file of walkDir('src/content').filter((f) => f.endsWith('.ts'))) {
    const src = read(file).replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, '');
    for (const m of src.matchAll(/'([^'\n]*)'|"([^"\n]*)"|`([^`]*)`/g)) {
      const text = m[1] ?? m[2] ?? m[3];
      for (const s of strayNumbers(text, patterns)) errors.push(`${file}: numeric literal "${s}"`);
      siteScan(file, text, '', /^https?:\/\//.test(text));
    }
  }
  // Meta content (SEO, palette concepts) is prose too.
  for (const file of ['content/meta/seo.json', 'content/meta/index-extra.json']) {
    walkProps(readJson(file), (value, p, key) => {
      if (typeof value === 'string' && key !== 'href') {
        for (const s of strayNumbers(value, patterns)) errors.push(`${file}${p}: numeric literal "${s}"`);
      }
    }, '');
  }

  // The generator's customBlocks map must name every CUSTOM block, each from a file that exports it.
  const codegen = readJson('exeris-codegen.json');
  const mapped = codegen.customBlocks ?? {};
  for (const name of blocks.all) {
    const entry = mapped[name];
    if (!entry) { errors.push(`exeris-codegen.json: customBlocks has no entry for ${name}`); continue; }
    // The import is written into src/app/generated/pages/<view>.component.ts, two levels below src/app.
    const resolved = `${join(ROOT, 'src/app', entry.import.replace(/^\.\.\/\.\.\//, ''))}.ts`;
    if (!existsSync(resolved)) errors.push(`exeris-codegen.json: ${name} imports ${entry.import}, which does not exist`);
    else if (!new RegExp(`export class ${entry.symbol}\\b`).test(readFileSync(resolved, 'utf8'))) errors.push(`exeris-codegen.json: ${entry.import} does not export ${entry.symbol}`);
  }
  for (const name of Object.keys(mapped)) if (!blocks.all.has(name)) errors.push(`exeris-codegen.json: customBlocks names ${name}, which is not in names.ts`);

  // Claim lock: the copy of every claim in use must equal the locked copy.
  for (const key of used) {
    const hash = createHash('sha256').update(claims[key].copy).digest('hex');
    if (!lock[key]) errors.push(`claims.lock.json: ${key} is used but not locked (run npm run claims:lock after review)`);
    else if (lock[key] !== hash) errors.push(`claims.lock.json: the registered copy of ${key} changed upstream; review the pages that quote it, then run npm run claims:lock`);
  }
  for (const key of Object.keys(lock)) {
    if (!used.has(key)) errors.push(`claims.lock.json: ${key} is locked but no page uses it`);
  }

  return { errors, used: [...used].sort() };
}

export function writeLock() {
  const claims = readJson('src/data/claims.json').claims;
  const { used } = checkContent({ lock: {} });
  const lock = Object.fromEntries(used.map((k) => [k, createHash('sha256').update(claims[k].copy).digest('hex')]));
  writeFileSync(join(ROOT, 'content/meta/claims.lock.json'), `${JSON.stringify(lock, null, 2)}\n`);
  return lock;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--lock')) {
    const lock = writeLock();
    console.log(`check-content: locked ${Object.keys(lock).length} claims`);
  } else {
    const { errors, used } = checkContent();
    if (errors.length) {
      for (const e of errors) console.error(`  ✗ ${e}`);
      console.error(`check-content: ${errors.length} problem(s)`);
      process.exit(1);
    }
    console.log(`check-content: ok (${used.length} claims in use)`);
  }
}
