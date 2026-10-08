import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..');

function files(dir: string): string[] {
  return readdirSync(join(ROOT, dir)).flatMap((f) => {
    const p = `${dir}/${f}`;
    if (p === 'src/app/generated') return [];
    return statSync(join(ROOT, p)).isDirectory() ? files(p) : [p];
  });
}

const AUTHORED = [...files('content'), ...files('src/content'), ...files('src/app'), 'src/index.html', 'README.md'];

/** Phrases the site spec bans from every authored file. */
const BANNED: [RegExp, string][] = [
  [/Tri-?City/i, 'the location is "Gdynia, Poland"'],
  [/\bDRAFT\b|TODO|awaiting approval|\bpending\b/, 'no process or status markers'],
  [/\bSLA\b/, 'no SLA claim'],
  [/AXA|WORKDAY|\bVISA\b|COGNIZANT|WSB MERITO/i, 'no client or employer names'],
  [/v0\.5\.0|4f8a2b1|SPI v1 STABLE|CI · PASS/, 'prototype placeholders'],
  [/€/, 'no prices'],
  [/fonts\.googleapis|googletagmanager|google-analytics|gtag\(|plausible|hotjar|segment\.(io|com)/i, 'no third-party requests'],
];

describe('copy rules', () => {
  for (const [re, why] of BANNED) {
    it(`no file matches ${re} (${why})`, () => {
      const hits = AUTHORED.filter((f) => re.test(readFileSync(join(ROOT, f), 'utf8')));
      expect(hits).toEqual([]);
    });
  }

  it('states the JDK baseline as Java 25 LTS, never a JDK 26 baseline', () => {
    const hits = AUTHORED.filter((f) => /JDK 26|Java 26/.test(readFileSync(join(ROOT, f), 'utf8')));
    expect(hits).toEqual([]);
  });
});
