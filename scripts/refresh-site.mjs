#!/usr/bin/env node
// Rebuilds exeris.eu when the data it shows changed upstream: reads the registers and releases the
// site is built from, as a build would, and starts a Workers build through the exeris-web Worker's
// deploy hook when their digest differs from the live site's data-digest.json. The site reads that
// data at build time only, so a new release or register row reaches it this way or with the next
// push to this repository.
import { fileURLToPath } from 'node:url';
import { startBuild } from './deploy-hook.mjs';
import { dataDigest, fetchAll } from './fetch-data.mjs';

const LIVE_DIGEST = 'https://exeris.eu/data-digest.json';

/** Why the site needs a rebuild, or null: `live` is the live digest (null when it has none). */
export function staleData(live, now) {
  if (!live) return 'the live site publishes no data digest';
  return live === now ? null : 'the upstream data differs from the data the live site was built from';
}

async function liveDigest() {
  const res = await fetch(LIVE_DIGEST, { headers: { accept: 'application/json' } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`refresh-site: ${LIVE_DIGEST} answered ${res.status}`);
  return (await res.json()).digest ?? null;
}

async function main() {
  const force = process.argv.includes('--force');
  const dryRun = process.argv.includes('--dry-run');
  const reason = force ? 'requested' : staleData(await liveDigest(), dataDigest(await fetchAll()));
  if (!reason) {
    console.log('refresh-site: exeris.eu is current; its upstream data has not changed');
    return;
  }
  console.log(`refresh-site: rebuild: ${reason}`);
  if (dryRun) return;
  console.log(`refresh-site: ${await startBuild('SITE_DEPLOY_HOOK', 'exeris-web')}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
