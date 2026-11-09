import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SearchEntry } from '../projects/shell/src/lib/fuzzy';
import { TextSearch, mergeResults, type TextSearchState } from '../projects/shell/src/lib/text-search';

const entry = (href: string): SearchEntry => ({ kind: 'text', title: href, href });

/** A search whose answers the test releases by hand, in any order. */
function controlled() {
  const calls: { query: string; resolve: (r: readonly SearchEntry[]) => void; reject: (e: unknown) => void }[] = [];
  const search = (query: string) => new Promise<readonly SearchEntry[]>((resolve, reject) => calls.push({ query, resolve, reject }));
  return { calls, search };
}

describe('TextSearch', () => {
  let states: TextSearchState[];
  const last = () => states[states.length - 1];

  beforeEach(() => {
    vi.useFakeTimers();
    states = [];
  });
  afterEach(() => vi.useRealTimers());

  it('searches once typing pauses, for the query typed last', async () => {
    const { calls, search } = controlled();
    const text = new TextSearch(search, (s) => states.push(s), 150, 2);
    text.run('ar');
    vi.advanceTimersByTime(100);
    text.run('arena');
    vi.advanceTimersByTime(149);
    expect(calls).toHaveLength(0);
    expect(last()).toEqual({ results: [], searching: true });
    vi.advanceTimersByTime(1);
    expect(calls.map((c) => c.query)).toEqual(['arena']);
    calls[0].resolve([entry('/a')]);
    await vi.runAllTimersAsync();
    expect(last()).toEqual({ results: [entry('/a')], searching: false });
  });

  it('never lets a slower earlier answer replace a later one', async () => {
    const { calls, search } = controlled();
    const text = new TextSearch(search, (s) => states.push(s), 150, 2);
    text.run('arena');
    vi.advanceTimersByTime(150);
    text.run('arenas');
    vi.advanceTimersByTime(150);
    calls[1].resolve([entry('/later')]);
    await vi.runAllTimersAsync();
    calls[0].resolve([entry('/earlier')]);
    await vi.runAllTimersAsync();
    expect(last()).toEqual({ results: [entry('/later')], searching: false });
  });

  it('clears the results of the previous query as soon as the query changes', async () => {
    const { calls, search } = controlled();
    const text = new TextSearch(search, (s) => states.push(s), 150, 2);
    text.run('arena');
    vi.advanceTimersByTime(150);
    calls[0].resolve([entry('/a')]);
    await vi.runAllTimersAsync();
    text.run('arena p');
    expect(last()).toEqual({ results: [], searching: true });
  });

  it('runs no search under the minimum length, and clears the results', () => {
    const { calls, search } = controlled();
    const text = new TextSearch(search, (s) => states.push(s), 150, 2);
    text.run(' a ');
    vi.advanceTimersByTime(1000);
    expect(calls).toHaveLength(0);
    expect(last()).toEqual({ results: [], searching: false });
  });

  it('stops searching, with no results, when the search fails', async () => {
    const { calls, search } = controlled();
    const text = new TextSearch(search, (s) => states.push(s), 150, 2);
    text.run('arena');
    vi.advanceTimersByTime(150);
    calls[0].reject(new Error('offline'));
    await vi.runAllTimersAsync();
    expect(last()).toEqual({ results: [], searching: false });
  });
});

describe('mergeResults', () => {
  it('lists a full-text result after the index matches, and not twice', () => {
    expect(mergeResults([entry('/a')], [entry('/a'), entry('/b#h')]).map((e) => e.href)).toEqual(['/a', '/b#h']);
  });
});
