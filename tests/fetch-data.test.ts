import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error -- plain ESM modules without type declarations
import { FetchError, headersFor, loadUpstream, repoOf, strictFetch } from '../scripts/fetch-data.mjs';
// @ts-expect-error -- plain ESM module without type declarations
import { isRuntimeError } from '../scripts/lighthouse-ci.mjs';

const ENV = { GITHUB_TOKEN: 'secret-token' };

describe('headersFor', () => {
  it('sends the token to api.github.com', () => {
    const h = headersFor('https://api.github.com/repos/exeris-systems/exeris-kernel/releases/latest', ENV);
    expect(h.Authorization).toBe('Bearer secret-token');
    expect(h.Accept).toBe('application/vnd.github+json');
  });

  it.each([
    'https://repo1.maven.org/maven2/eu/exeris/exeris-initializr/maven-metadata.xml',
    'https://raw.githubusercontent.com/exeris-systems/exeris-docs/abc/cap-license-registry.md',
    'https://api.github.com.evil.example/x',
    'https://evil.example/api.github.com',
    'https://user@api.github.com.evil.example/x',
    'https://github.com/exeris-systems/exeris-docs',
  ])('keeps the token off %s', (url) => {
    const h = headersFor(url, ENV);
    expect(h).not.toHaveProperty('Authorization');
    expect(h['User-Agent']).toBe('exeris-web-build');
    expect(JSON.stringify(h)).not.toContain('secret-token');
  });

  it('sends no Authorization header without a token', () => {
    expect(headersFor('https://api.github.com/x', {})).not.toHaveProperty('Authorization');
  });
});

describe('repoOf', () => {
  const publicNames = new Set(['exeris-caps-a']);

  it('is null for a repository outside the public list, without reading a README', async () => {
    const readme = vi.fn();
    expect(await repoOf('exeris-caps-b', publicNames, readme)).toBeNull();
    expect(readme).not.toHaveBeenCalled();
  });

  it('links a public repository and reads its README', async () => {
    const readme = vi.fn(async () => '# exeris-caps-a\n\nA thing as an Exeris capability. More.\n\nStatus: built against `exeris-kernel` 0.13.0.');
    expect(await repoOf('exeris-caps-a', publicNames, readme)).toEqual({
      url: 'https://github.com/exeris-systems/exeris-caps-a',
      summary: 'A thing as an Exeris capability.',
      builtAgainst: '0.13.0',
    });
    expect(readme).toHaveBeenCalledWith('exeris-caps-a');
  });
});

describe('strictFetch', () => {
  it('is strict in a Cloudflare Pages build and when asked, and only then', () => {
    expect(strictFetch({ CF_PAGES: '1' })).toBe(true);
    expect(strictFetch({ SITE_FETCH_STRICT: '1' })).toBe(true);
    expect(strictFetch({})).toBe(false);
    expect(strictFetch({ CF_PAGES: '0' })).toBe(false);
  });
});

describe('loadUpstream', () => {
  it('returns the fetched files', async () => {
    const files = { 'claims.json': {} };
    expect(await loadUpstream(async () => files, { strict: false, committed: true })).toBe(files);
  });

  it('keeps the committed data on a fetch error', async () => {
    const warn = vi.fn();
    const result = await loadUpstream(
      async () => {
        throw new FetchError('GET https://x: HTTP 503');
      },
      { strict: false, committed: true, warn },
    );
    expect(result).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('keeping the committed data'));
  });

  it('fails on a fetch error when strict or when nothing is committed', async () => {
    const fail = async () => {
      throw new FetchError('GET https://x: HTTP 503');
    };
    await expect(loadUpstream(fail, { strict: true, committed: true })).rejects.toThrow('HTTP 503');
    await expect(loadUpstream(fail, { strict: false, committed: false })).rejects.toThrow('HTTP 503');
  });

  it.each([
    'duplicate claim key L12.absolute',
    'unknown licence "Foo"',
    'tooling artefacts disagree on the release',
    'no CITABLE row "serverless arm, ceiling"',
  ])('fails on a parser or consistency error: %s', async (message) => {
    const warn = vi.fn();
    await expect(
      loadUpstream(
        async () => {
          throw new Error(message);
        },
        { strict: false, committed: true, warn },
      ),
    ).rejects.toThrow(message);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('isRuntimeError', () => {
  it('recognises a Lighthouse runtime error', () => {
    expect(isRuntimeError('"runtimeError": { "code": "NO_NAVSTART" }')).toBe(true);
    expect(isRuntimeError('Error: Lighthouse failed with exit code 1')).toBe(true);
  });

  it('does not treat a failed assertion as a runtime error', () => {
    expect(isRuntimeError('✘  categories:performance failure for minScore assertion\nAssertion failed. Exiting with status code 1.')).toBe(false);
  });
});

describe('serve-static', () => {
  it('answers 400 to a malformed escape and keeps serving', async () => {
    const port = 4900 + Math.floor(Math.random() * 90);
    const root = mkdtempSync(join(tmpdir(), 'serve-static-'));
    writeFileSync(join(root, '404.html'), 'not found');
    const child = spawn(process.execPath, ['scripts/serve-static.mjs', root], { env: { ...process.env, PORT: String(port) } });
    try {
      await new Promise<void>((resolve, reject) => {
        child.stdout.on('data', (d) => /serving/.test(String(d)) && resolve());
        child.on('error', reject);
        child.on('exit', () => reject(new Error('server exited')));
      });
      const bad = await fetch(`http://127.0.0.1:${port}/%`);
      expect(bad.status).toBe(400);
      const next = await fetch(`http://127.0.0.1:${port}/nothing-here`);
      expect(next.status).toBe(404);
    } finally {
      child.kill();
    }
  });
});
