// Markdown of the upstream documentation to the HTML docs.exeris.eu prerenders. Everything here
// runs at build time; the browser receives only the sanitised result.
import { parseDocument } from 'htmlparser2';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';

/** The frontmatter between the leading `---` lines, as flat key/value strings, and the body. */
export function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) return { data: {}, body: text };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2].trim().replace(/^"(.*)"$/, '$1');
  }
  return { data, body: text.slice(m[0].length) };
}

/** Only a document its own repository marks public and active is published. */
export function isPublished(data) {
  return data.visibility === 'public' && data.status === 'active';
}

/**
 * The route of a source file: `kernel:docs/subsystems/memory.md` → `kernel/subsystems/memory`; a
 * README is its directory: `sdk:README.md` → `sdk`, `sdk:exeris-sdk-tck/README.md` →
 * `sdk/exeris-sdk-tck`.
 */
export function routeOf(sourceRoute, path) {
  const rest = path.replace(/^docs\//, '').replace(/\.md$/, '').replace(/(^|\/)README$/, '');
  return rest ? `${sourceRoute}/${rest}` : sourceRoute;
}

/** GitHub's heading slug: lower case, punctuation dropped, spaces to hyphens. */
export function slug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');
}

/** Resolves `target` against the directory of `from`, both repository paths. */
function resolvePath(from, target) {
  const parts = from.split('/').slice(0, -1);
  for (const seg of target.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.' && seg !== '') parts.push(seg);
  }
  return parts.join('/');
}

/**
 * The repository path an organisation URL names, when it names a ref the site reads: `{ repo, path }`
 * for `https://github.com/exeris-systems/<repo>/blob/<ref>/<path>` with `<ref>` one of `refs(repo)`.
 * A ref may contain a slash, so the path is what follows a known ref, never a guess at where the ref ends.
 */
export function orgTarget(href, refs) {
  let url;
  try {
    url = new URL(href);
  } catch {
    return undefined;
  }
  if (url.protocol !== 'https:' || url.host !== 'github.com') return undefined;
  const m = url.pathname.match(/^\/exeris-systems\/([^/]+)\/blob\/(.+)$/);
  if (!m) return undefined;
  const rest = decodeURIComponent(m[2]);
  const ref = refs(m[1]).find((r) => rest.startsWith(`${r}/`));
  return ref ? { repo: m[1], path: rest.slice(ref.length + 1), hash: url.hash.slice(1) } : undefined;
}

/**
 * Where a link in a published document points: an in-page anchor stays as it is; a relative link
 * to another published document, or an organisation URL naming a published document at a ref the
 * site reads, becomes its route; any other relative link goes to the file on GitHub at the commit
 * the build read; any other absolute URL stays as it is.
 */
export function rewriteHref(href, { path, published, blob, site }) {
  if (href.startsWith('#') || href.startsWith('//')) return href;
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
    const org = site && orgTarget(href, site.refs);
    const route = org && site.route(org.repo, org.path);
    return route ? `/${route}${org.hash ? `#${org.hash}` : ''}` : href;
  }
  const [target, hash] = href.split('#');
  const resolved = resolvePath(path, decodeURIComponent(target));
  const route = published.get(resolved);
  if (route) return `/${route}${hash ? `#${hash}` : ''}`;
  return `${blob(resolved)}${hash ? `#${hash}` : ''}`;
}

export const SANITIZE = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'em', 'strong',
    'del', 's', 'hr', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'details', 'summary', 'sub', 'sup', 'kbd',
  ],
  allowedAttributes: {
    h1: ['id'], h2: ['id'], h3: ['id'], h4: ['id'], h5: ['id'], h6: ['id'],
    a: ['href'],
    code: ['class'],
    pre: ['class'],
    ol: ['start'],
    th: ['align', 'colspan', 'rowspan', 'style'],
    td: ['align', 'colspan', 'rowspan', 'style'],
    details: ['open'],
  },
  allowedClasses: { code: [/^language-[\w-]+$/], pre: ['ex-doc__diagram'] },
  allowedStyles: { th: { 'text-align': [/^(left|right|center)$/] }, td: { 'text-align': [/^(left|right|center)$/] } },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false,
};

/**
 * Renders one document. Headings get GitHub's anchor ids, so links into a section keep working;
 * a Mermaid block is shown as its source, marked as a diagram; links are rewritten by
 * `rewriteHref`; raw HTML in the markdown is reduced to the tags and attributes of SANITIZE.
 */
export function renderDoc(body, { path, published, blob, site }) {
  const md = new MarkdownIt({ html: true, linkify: false, typographer: false });
  const seen = new Map();
  const headings = [];

  md.core.ruler.push('exeris_docs', (state) => {
    const tokens = state.tokens;
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.type === 'heading_open') {
        const text = tokens[i + 1].children.filter((c) => c.type === 'text' || c.type === 'code_inline').map((c) => c.content).join('');
        const base = slug(text);
        const n = seen.get(base) ?? 0;
        seen.set(base, n + 1);
        const id = n ? `${base}-${n}` : base;
        t.attrSet('id', id);
        headings.push({ level: Number(t.tag.slice(1)), text, id });
      }
      if (t.type === 'inline') {
        for (const c of t.children ?? []) {
          if (c.type === 'link_open') c.attrSet('href', rewriteHref(c.attrGet('href') ?? '', { path, published, blob, site }));
        }
      }
    }
  });

  const fence = md.renderer.rules.fence;
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const t = tokens[idx];
    if (t.info.trim() === 'mermaid') {
      return `<pre class="ex-doc__diagram"><code class="language-mermaid">${md.utils.escapeHtml(t.content)}</code></pre>\n`;
    }
    return fence(tokens, idx, options, env, self);
  };

  const html = sanitizeHtml(md.render(body), SANITIZE);
  return { html, tree: toTree(html), headings, description: describe(body) };
}

/** Elements whose whitespace-only text children are layout, not content. */
const BLOCK_CONTAINERS = new Set(['ul', 'ol', 'table', 'thead', 'tbody', 'tr', 'blockquote', 'details']);

/**
 * The sanitised HTML as a tree the page renders with Angular templates, so no HTML string reaches
 * the browser: an element is `{ t, a?, c? }` (tag, attributes, children), text is a string. A
 * cell's `text-align` style becomes its `align` attribute.
 */
export function toTree(html) {
  const convert = (nodes, parent) =>
    nodes.flatMap((n) => {
      if (n.type === 'text') return BLOCK_CONTAINERS.has(parent) || parent === null ? (n.data.trim() ? [n.data] : []) : [n.data];
      if (n.type !== 'tag') return [];
      const a = { ...n.attribs };
      const align = a.style?.match(/text-align:\s*(left|right|center)/)?.[1];
      delete a.style;
      if (align) a.align = align;
      const node = { t: n.name };
      if (Object.keys(a).length) node.a = a;
      const c = convert(n.children, n.name);
      if (c.length) node.c = c;
      // A link left empty by the sanitiser (a README badge whose image was removed) is dropped.
      if (n.name === 'a' && !c.some((x) => typeof x !== 'string' || x.trim())) return [];
      return [node];
    });
  return convert(parseDocument(html).children, null);
}

/**
 * The page description: the first paragraph of at least 40 characters as plain text, cut at a
 * word near 160 characters. A short label paragraph ("Physical layout:") is skipped.
 */
function describe(body) {
  const tokens = new MarkdownIt({ html: true }).parse(body, {});
  let text = '';
  for (let i = 0; i < tokens.length && text.length < 40; i++) {
    if (tokens[i].type !== 'paragraph_open') continue;
    text = tokens[i + 1].children
      .filter((c) => c.type === 'text' || c.type === 'code_inline' || c.type === 'softbreak' || c.type === 'hardbreak')
      .map((c) => (c.type.endsWith('break') ? ' ' : c.content))
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
  }
  if (text.length <= 160) return text;
  return `${text.slice(0, 157).replace(/\s+\S*$/, '')}…`;
}
