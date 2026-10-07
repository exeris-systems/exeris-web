#!/usr/bin/env node
// Regenerates the pages emitted by @exeris/codegen-ts from the authored View IR.
// The output directory is removed first: the generator does not overwrite existing files,
// and a stale page from a deleted or renamed view must not survive into the build.
import { rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync(new URL('../exeris-codegen.json', import.meta.url), 'utf8'));
const outputPath = process.argv[2] ?? config.outputPath;
rmSync(outputPath, { recursive: true, force: true });

const result = spawnSync('exeris-gen', ['generate', '-o', outputPath], { stdio: process.argv[2] ? 'ignore' : 'inherit', shell: process.platform === 'win32' });
if (result.status !== 0) {
  console.error(`exeris-gen generate failed with status ${result.status}`);
  process.exit(result.status ?? 1);
}
