/**
 * Typed access to the build-time data under src/data. The JSON is written by
 * scripts/fetch-data.mjs from the upstream registers; nothing here is fetched at runtime.
 */
import claimsJson from '../../data/claims.json';
import capsJson from '../../data/caps.json';
import skusJson from '../../data/skus.json';
import coldStartJson from '../../data/cold-start.json';
import sagaJson from '../../data/saga-v2.json';
import buildMetaJson from '../../data/build-meta.json';
import siteShaJson from '../../data/site-sha.json';

export interface SourceLink {
  label: string;
  url: string;
}

export interface Claim {
  id: string;
  variant: string;
  label: string | null;
  quotable: boolean;
  copy: string;
  fence: string | null;
  sources: SourceLink[];
}

/** Readiness of a cap or SKU, lowest first. */
export type Readiness = 'poc' | 'snapshot' | 'released';

export type Licence = 'community' | 'commercial' | 'enterprise-private';

/** A public repository of a cap or SKU, and what its README says about it. */
export interface Repo {
  url: string;
  /** The first sentence of the README paragraph after the H1. */
  summary: string;
  /** The kernel version on the README's `Status:` line, when it names one. */
  builtAgainst: string | null;
}

export interface Cap {
  name: string;
  short: string;
  layer: number;
  layerName: string;
  licence: Licence;
  licenceNote: string | null;
  visibility: string;
  /** Build state: specified, scaffolded or implemented. */
  build: string;
  /** Readiness; `poc` unless the registry says otherwise. */
  status: Readiness;
  /** Null when the repository is not public. */
  repo: Repo | null;
}

export interface Layer {
  n: number;
  name: string;
  count: number;
}

export interface Sku {
  id: string;
  name: string;
  family: string;
  closedSource: boolean;
  caps: string[];
  skuSpecificCaps: string[];
  note: string | null;
  capCount: number;
  /** The lowest readiness among the SKU's caps. */
  status: Readiness;
  /** Null when the repository is not public. */
  repo: Repo | null;
}

export interface ColdStartArm {
  arm: string;
  label: string;
  qualifier: string;
  exeris?: boolean;
  target: string;
  runId: string;
  claimScope: string;
  transport: string;
  tls: boolean;
  executionVm: string;
  n: number;
  startupMs: number;
  ttfrMs: number;
  spawnToFirstRequestMs: number;
  peakRssMb: number;
  path: string;
  env: {
    hardwareProfile: string;
    cpu: string | null;
    logicalThreads: number | null;
    architecture: string | null;
    jdkMajor: number | null;
    os: string | null;
  } | null;
}

export interface SagaRow {
  figure: string;
  value: string;
  artifact: string;
  state: string;
  segment: string | null;
}

export interface UpstreamSource {
  repo: string;
  commit: string;
  path: string;
}

export const CLAIMS = claimsJson.claims as unknown as Readonly<Record<string, Claim>>;
export const CLAIMS_SOURCE = claimsJson.source as UpstreamSource;
export const WITHDRAWN = claimsJson.withdrawn as readonly string[];
export const NEVER_QUOTE_ALONE = claimsJson.neverQuoteAlone as readonly string[];

export const CAPS = capsJson.caps as readonly Cap[];
export const LAYERS = capsJson.layers as readonly Layer[];
export const CAP_TOTALS = capsJson.totals as Readonly<Record<Licence | 'total', number>>;
export const CAPS_SOURCE = capsJson.source as UpstreamSource;

export const SKUS = skusJson.skus as readonly Sku[];
/** Ids of the SKUs whose repository is public. */
export const SKUS_WITH_REPO: readonly string[] = SKUS.filter((s) => s.repo).map((s) => s.id);
export const SKUS_SOURCE = skusJson.source as UpstreamSource;

export const COLD_START = coldStartJson as unknown as {
  source: UpstreamSource;
  run: string;
  statistic: string;
  arms: ColdStartArm[];
};

export const SAGA_V2 = sagaJson as unknown as {
  source: UpstreamSource;
  front: Record<string, string>;
  scopeSentence: string | null;
  rows: SagaRow[];
};

export const BUILD_META = buildMetaJson as {
  kernel: { tag: string; url: string; publishedAt: string };
  tooling: { group: string; version: string; artifacts: string[]; jarUrl: string; centralUrl: string };
  sources: Record<string, string>;
};

export const TOOLING = BUILD_META.tooling;

export const SITE_SHA = (siteShaJson as { sha: string | null }).sha;

/** A registered claim by key (`L12.absolute`). Unknown keys fail the build at prerender. */
export function claim(key: string): Claim {
  const c = CLAIMS[key];
  if (!c) throw new Error(`claims.json has no claim ${key}`);
  if (!c.quotable) throw new Error(`claim ${key} is registered as not quotable`);
  return c;
}

export function sku(id: string): Sku {
  const s = SKUS.find((x) => x.id === id);
  if (!s) throw new Error(`skus.json has no SKU ${id}`);
  return s;
}

export function capByShort(short: string): Cap | undefined {
  return CAPS.find((c) => c.short === short);
}

/** SKUs whose composition lists a cap, by the cap's short name. */
export function skusUsingCap(short: string): Sku[] {
  return SKUS.filter((s) => s.caps.includes(short));
}

/** A GitHub link to a file of an upstream repository, at the commit the build read. */
export function upstreamUrl(source: UpstreamSource, path = source.path): string {
  return `https://github.com/exeris-systems/${source.repo}/blob/main/${path}`;
}

/** Readiness values, lowest first, with the label a badge shows. */
export const READINESS: readonly { key: Readiness; label: string; hint: string }[] = [
  { key: 'poc', label: 'PoC', hint: 'Proof of concept: specified or scaffolded, not published' },
  { key: 'snapshot', label: 'Snapshot', hint: 'Published as a snapshot build, open to change' },
  { key: 'released', label: 'Released', hint: 'Published as a release' },
];

export function readinessLabel(status: Readiness): string {
  return READINESS.find((r) => r.key === status)?.label ?? 'PoC';
}

/**
 * Values that are not authored but come from the data layer: the versions of the published
 * tooling and the latest kernel release. A page names them as `{tooling.version}` and
 * `{kernel.version}` in prose and code samples.
 */
export const VERSION_TOKENS: Readonly<Record<string, string>> = {
  'tooling.version': TOOLING.version,
  'kernel.version': BUILD_META.kernel.tag.replace(/^v/, ''),
};

/** `text` with every version token replaced; other braces are left as they are. */
export function fillVersions(text: string): string {
  return text.replace(/\{((?:tooling|kernel)\.version)\}/g, (_m, key: string) => VERSION_TOKENS[key]);
}

/**
 * Structural counts a page may show, each derived from a register so no count is typed into
 * the content. Keys are what view props name in `{ "count": "<key>" }`.
 */
export function structuralCount(key: string): number {
  const [kind, arg] = key.split(':');
  switch (kind) {
    case 'caps.status':
      return CAPS.filter((c) => c.status === arg).length;
    case 'skus.status':
      return SKUS.filter((s) => s.status === arg).length;
    case 'caps.total':
      return CAP_TOTALS.total;
    case 'caps.community':
      return CAP_TOTALS.community;
    case 'caps.commercial':
      return CAP_TOTALS.commercial;
    case 'caps.enterprise-private':
      return CAP_TOTALS['enterprise-private'];
    case 'layers':
      return LAYERS.length;
    case 'licences':
      return Object.keys(CAP_TOTALS).filter((k) => k !== 'total').length;
    case 'skus':
      return SKUS.length;
    case 'sku.caps':
      return sku(arg).capCount;
    case 'layer.caps':
      return LAYERS.find((l) => l.n === Number(arg))?.count ?? 0;
    default:
      throw new Error(`unknown structural count ${key}`);
  }
}
