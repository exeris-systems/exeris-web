import type { SearchEntry } from '@exeris-web/shell';

/** What Pagefind returns for one page (its `data()`), as far as the palette reads it. */
export interface PagefindPage {
  readonly url: string;
  readonly excerpt: string;
  readonly meta: { readonly title?: string; readonly section?: string };
  readonly sub_results?: readonly { readonly title: string; readonly url: string; readonly excerpt: string }[];
}

interface Pagefind {
  search(query: string): Promise<{ readonly results: readonly { data(): Promise<PagefindPage> }[] } | null>;
}

/**
 * The index the build writes with `pagefind --site dist/docs/browser`. Its loader is a module of
 * this origin, imported when the reader first types in the palette, so a page that is never
 * searched loads none of it.
 */
const PAGEFIND = '/pagefind/pagefind.js';
const RESULTS = 8;

let pagefind: Promise<Pagefind> | null = null;

/** The documents whose text matches `query`, best first, as palette entries. */
export async function fullText(query: string): Promise<readonly SearchEntry[]> {
  pagefind ??= import(/* @vite-ignore */ PAGEFIND) as Promise<Pagefind>;
  const found = await (await pagefind).search(query);
  if (!found) return [];
  const pages = await Promise.all(found.results.slice(0, RESULTS).map((r) => r.data()));
  return pages.map(toEntry);
}

/**
 * One result as a palette entry: the page, or the section of it that matched best, at its route
 * (Pagefind names the file, `/sdk/x/`, the site serves `/sdk/x`), with the matched passage.
 */
export function toEntry(page: PagefindPage): SearchEntry {
  const title = page.meta.title ?? routeOf(page.url);
  const sub = page.sub_results?.find((s) => s.url.includes('#'));
  return {
    kind: 'text',
    title: sub && sub.title !== title ? `${title} › ${sub.title}` : title,
    href: routeOf(sub?.url ?? page.url),
    hint: page.meta.section,
    excerpt: plain(sub?.excerpt ?? page.excerpt),
  };
}

/** A Pagefind URL as a route: without `index.html` and without the slash before a fragment or at the end. */
export function routeOf(url: string): string {
  const [path, hash] = url.split('#');
  const route = path.replace(/index\.html$/, '').replace(/(.)\/$/, '$1');
  return hash ? `${route}#${hash}` : route;
}

const ENTITIES: Readonly<Record<string, string>> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", '#x27': "'" };

/** An excerpt as plain text: Pagefind marks the match with `<mark>` and escapes the rest. */
export function plain(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|lt|gt|quot|#39|#x27);/g, (_, e: string) => ENTITIES[e])
    .replace(/\s+/g, ' ')
    .trim();
}
