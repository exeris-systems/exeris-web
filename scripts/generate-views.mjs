#!/usr/bin/env node
// Regenerates the pages emitted by @exeris/codegen-ts from the authored View IR. The generator
// parses every view_*.json with its own schema, so this step is also the IR's validation.
// The output directory is removed first: the generator does not overwrite existing files, and
// a page of a deleted or renamed view must not survive into the build.
import { readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const config = JSON.parse(readFileSync(new URL('../exeris-codegen.json', import.meta.url), 'utf8'));
const outputPath = process.argv[2] ?? config.outputPath;
rmSync(outputPath, { recursive: true, force: true });

const quiet = Boolean(process.argv[2]);
const result = spawnSync('exeris-gen', ['generate', '-o', outputPath], {
  stdio: quiet ? ['ignore', 'ignore', 'inherit'] : 'inherit',
  shell: process.platform === 'win32',
});
if (result.status !== 0) {
  console.error(`exeris-gen generate failed with status ${result.status}`);
  process.exit(result.status ?? 1);
}
