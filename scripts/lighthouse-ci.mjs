#!/usr/bin/env node
// Runs `lhci autorun` and repeats it once when, and only when, Lighthouse reported a runtime error
// (for example NO_NAVSTART, where Chrome's trace of a page load carried no navigation start). A
// runtime error means no measurement was taken; it says nothing about the page. An assertion
// failure is a measurement and is never retried, and every URL, run and threshold stays as set in
// lighthouserc.json.
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const LHCI = ['--yes', '@lhci/cli@0.15.1', 'autorun'];
const RUNTIME_ERROR = /"runtimeError"|\(NO_NAVSTART\)|Lighthouse failed with exit code/;

/** Whether the output of a failed lhci run reports a Lighthouse runtime error, not a failed assertion. */
export function isRuntimeError(output) {
  return RUNTIME_ERROR.test(output);
}

function run() {
  return new Promise((resolve) => {
    const child = spawn('npx', LHCI, { stdio: ['inherit', 'pipe', 'pipe'] });
    let output = '';
    for (const [stream, sink] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
      stream.on('data', (chunk) => {
        output += chunk;
        sink.write(chunk);
      });
    }
    child.on('close', (code) => resolve({ code: code ?? 1, output }));
  });
}

async function main() {
  let result = await run();
  if (result.code !== 0 && isRuntimeError(result.output)) {
    console.warn('lighthouse-ci: Lighthouse reported a runtime error; repeating the whole run once');
    rmSync('.lighthouseci', { recursive: true, force: true });
    result = await run();
  }
  process.exit(result.code);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
