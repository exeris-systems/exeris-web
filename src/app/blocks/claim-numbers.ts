/**
 * The numbers a chart draws are read out of registered copy strings, never typed: a chart of a
 * claim cannot disagree with the claim. These helpers are free of Angular so the tests can run
 * them against claims.json.
 */

/** Every `(a vs b µs)` or `(a → b µs)` pair in a claim's copy, as numbers, in order. */
export function pairsIn(copy: string, sep: 'vs' | '→'): [number, number][] {
  const re = sep === 'vs' ? /\(([\d.]+)(?: µs)? vs ([\d.]+) µs/g : /\(([\d.]+) → ([\d.]+) µs\)/g;
  const pairs = [...copy.matchAll(re)].map((m) => [Number(m[1]), Number(m[2])] as [number, number]);
  if (!pairs.length) throw new Error(`no "${sep}" pair in claim copy: ${copy}`);
  return pairs;
}

/** Milliseconds as the seconds figure the L14 strings use (two decimals). */
export const seconds = (ms: number): string => `${(ms / 1000).toFixed(2)} s`;

/** Megabytes rounded to whole MB, as the L14 absolute string states peak RSS. */
export const megabytes = (mb: number): string => `${Math.round(mb)} MB`;

/** Microseconds with one decimal, as the CPU-per-request strings state them. */
export const micros = (us: number): string => `${us.toFixed(1)} µs`;
