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
//    uses an unknown structural-count token, lacks an SEO entry, or is missing from the views
//    list of the renderer.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const readJson = (p) => JSON.parse(read(p));

/** Keys whose string value is not prose: links, claim references and their excerpts. */
const NON_PROSE_KEYS = new Set(['href', 'claim', 'excerpt', 'id', 'sku', 'tone', 'variant', 'kind', 'size', 'items', 'lang']);
/** Keys whose value may be a JSON number: layout only. */
const NUMBER_KEYS = new Set(['columns']);
const COUNT_TOKEN = /\{([a-z.:-]+)\}/g;
const COUNT_KEYS = /^(caps\.(total|community|commercial|enterprise-private)|layers|licences|skus|sku\.caps:[a-z-]+)$/;

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
          walkProps(props, (value, p, key) => {
            const where = `${at} props${p}`;
            if (typeof value === 'number' && !NUMBER_KEYS.has(key)) errors.push(`${where}: numeric literal ${value}`);
            if (typeof value !== 'string') return;
            if (key === 'claim' || (key === null && /\.claims\[\d+\]$/.test(p))) {
              useClaim(value, where);
              return;
            }
            if (key === 'claims') {
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

  // src/content: string literals of the typed site content.
  const walkDir = (dir) =>
    readdirSync(join(ROOT, dir)).flatMap((f) => {
      const p = `${dir}/${f}`;
      return statSync(join(ROOT, p)).isDirectory() ? walkDir(p) : [p];
    });
  for (const file of walkDir('src/content').filter((f) => f.endsWith('.ts'))) {
    const src = read(file).replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, '');
    for (const m of src.matchAll(/'([^'\n]*)'|"([^"\n]*)"|`([^`]*)`/g)) {
      const text = m[1] ?? m[2] ?? m[3];
      for (const s of strayNumbers(text, patterns)) errors.push(`${file}: numeric literal "${s}"`);
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

  // The renderer's view list must name every view that is not a generated page.
  const viewsTs = read('src/app/view/views.ts');
  const listed = new Set([...viewsTs.matchAll(/view_([a-z0-9-]+)\.json/g)].map((m) => m[1]));
  const generated = new Set([...viewsTs.matchAll(/GENERATED_VIEWS = \[([^\]]*)\]/g)].flatMap((m) => [...m[1].matchAll(/'([a-z-]+)'/g)].map((x) => x[1])));
  for (const { json } of loadViews()) {
    const name = json.view.name;
    if (!listed.has(name) && !generated.has(name)) errors.push(`src/app/view/views.ts: view ${name} is neither rendered nor generated`);
  }

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
