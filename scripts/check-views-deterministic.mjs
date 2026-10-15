#!/usr/bin/env node
// Runs the page generator twice into fresh directories and fails if the outputs differ: the
// generated tree is not committed, so a build must be able to reproduce it byte for byte.
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

function generate() {
  const dir = mkdtempSync(join(tmpdir(), 'exeris-views-'));
  const r = spawnSync(process.execPath, ['scripts/generate-views.mjs', dir], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
  return dir;
}

function tree(dir) {
  const out = new Map();
  const walk = (d) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else out.set(relative(dir, p), readFileSync(p, 'utf8'));
    }
  };
  walk(dir);
  return out;
}

const a = generate();
const b = generate();
const ta = tree(a);
const tb = tree(b);
const diff = [...new Set([...ta.keys(), ...tb.keys()])].filter((k) => ta.get(k) !== tb.get(k));
rmSync(a, { recursive: true, force: true });
rmSync(b, { recursive: true, force: true });
if (diff.length) {
  console.error(`check-views: generation is not deterministic: ${diff.join(', ')}`);
  process.exit(1);
}
console.log(`check-views: ${ta.size} generated files, identical across two runs`);
