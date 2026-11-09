import type { SearchEntry } from './fuzzy';

/** What a full-text search shows: its results for the query typed last, and whether one runs. */
export interface TextSearchState {
  readonly results: readonly SearchEntry[];
  readonly searching: boolean;
}

/**
 * Runs a full-text search as the reader types: once typing has paused for `delayMs`, from
 * `minChars` characters. A query typed after it supersedes an answer still on its way, so a slow
 * earlier answer never replaces a later one, and the results of an earlier query are dropped as soon
 * as the query changes, so Enter never opens a result for text no longer in the field.
 */
export class TextSearch {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private ticket = 0;

  constructor(
    private readonly search: (query: string) => Promise<readonly SearchEntry[]>,
    private readonly onChange: (state: TextSearchState) => void,
    private readonly delayMs = 150,
    private readonly minChars = 2,
  ) {}

  run(query: string): void {
    clearTimeout(this.timer);
    const ticket = ++this.ticket;
    const q = query.trim();
    if (q.length < this.minChars) {
      this.onChange({ results: [], searching: false });
      return;
    }
    this.onChange({ results: [], searching: true });
    this.timer = setTimeout(() => {
      this.search(q).then(
        (results) => {
          if (ticket === this.ticket) this.onChange({ results, searching: false });
        },
        () => {
          if (ticket === this.ticket) this.onChange({ results: [], searching: false });
        },
      );
    }, this.delayMs);
  }
}

/** The index's matches, then the full-text results that do not open a page already listed. */
export function mergeResults(own: readonly SearchEntry[], text: readonly SearchEntry[]): SearchEntry[] {
  const seen = new Set(own.map((e) => e.href));
  return [...own, ...text.filter((e) => !seen.has(e.href))];
}
