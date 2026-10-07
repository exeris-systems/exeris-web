/** One entry of the command-palette index. */
export interface SearchEntry {
  readonly kind: 'page' | 'capability' | 'sku' | 'concept' | 'doc';
  readonly title: string;
  readonly href: string;
  readonly hint?: string;
  readonly keywords?: string;
}

/**
 * Subsequence match score of `query` in `text`, or -1 when not every query character appears in
 * order. Contiguous runs, word starts and an early first match score higher.
 */
export function fuzzyScore(query: string, text: string): number {
  const q = query.toLowerCase().replace(/\s+/g, '');
  const t = text.toLowerCase();
  if (!q) return 0;
  let score = 0;
  let ti = 0;
  let run = 0;
  let first = -1;
  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found < 0) return -1;
    if (first < 0) first = found;
    run = found === ti ? run + 1 : 1;
    const wordStart = found === 0 || /[\s\-/·.]/.test(t[found - 1]);
    score += 1 + run * 2 + (wordStart ? 3 : 0);
    ti = found + 1;
  }
  return score - Math.min(first, 20) * 0.25;
}

/** Entries matching `query`, best first; the whole index, in order, for an empty query. */
export function searchIndex(entries: readonly SearchEntry[], query: string, limit = 12): SearchEntry[] {
  if (!query.trim()) return entries.slice(0, limit);
  return entries
    .map((entry, i) => {
      const title = fuzzyScore(query, entry.title);
      const extra = fuzzyScore(query, `${entry.hint ?? ''} ${entry.keywords ?? ''}`);
      const score = Math.max(title >= 0 ? title + 5 : -1, extra);
      return { entry, score, i };
    })
    .filter((r) => r.score >= 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, limit)
    .map((r) => r.entry);
}
