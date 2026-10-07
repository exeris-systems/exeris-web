/**
 * Site-wide content and link targets: navigation, footer, external URLs. Page content lives in
 * the view documents under content/views; this file holds what every page shares.
 */

export const SITE_URL = 'https://exeris.eu';
export const SITE_NAME = 'Exeris';

/** The Console (sign-in and onboarding). Nothing auth-related is built on this site. */
export const CONSOLE_URL = 'https://console.exeris.eu';

export const CONTACT_EMAIL = 'contact@exeris.eu';
export const CONTACT_HREF = `mailto:${CONTACT_EMAIL}`;

const GH = 'https://github.com/exeris-systems';

export const LINKS = {
  github: GH,
  kernel: `${GH}/exeris-kernel`,
  sdk: `${GH}/exeris-sdk`,
  tooling: `${GH}/exeris-tooling`,
  platformRepo: `${GH}/exeris-platform`,
  springRuntime: `${GH}/exeris-spring-runtime`,
  benchmarks: `${GH}/exeris-benchmarks`,
  claims: `${GH}/exeris-benchmarks/blob/main/docs/CLAIMS.md`,
  methodology: `${GH}/exeris-benchmarks/blob/main/docs/methodology.md`,
  hardwareProfiles: `${GH}/exeris-benchmarks/blob/main/docs/hardware-profiles.md`,
  whitepaper: `${GH}/exeris-kernel/blob/main/docs/whitepaper.md`,
  b2bWhitepaper: `${GH}/exeris-docs/blob/main/b2b-technical-whitepaper.md`,
  architecture: `${GH}/exeris-kernel/blob/main/docs/architecture.md`,
  hla: `${GH}/exeris-docs/blob/main/high-level-architecture.md`,
  adrIndex: `${GH}/exeris-docs/blob/main/adr-index.md`,
  capRegistry: `${GH}/exeris-docs/blob/main/cap-license-registry.md`,
  roadmap: `${GH}/exeris-kernel/blob/main/docs/ROADMAP.md`,
  aiBridge: `${GH}/exeris-ai-bridge`,
  agentHarness: `${GH}/exeris-agent-harness`,
  aiExecution: `${GH}/exeris-ai-execution`,
  blog: 'https://blog.arkstack.dev',
} as const;

export interface NavLink {
  readonly label: string;
  readonly href: string;
  readonly description?: string;
}

export interface NavItem {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly children?: readonly NavLink[];
}

export const NAV: readonly NavItem[] = [
  {
    id: 'platform',
    label: 'Platform',
    href: '/platform',
    children: [
      { label: 'Overview', href: '/platform', description: 'Substrate, capabilities, SKUs' },
      { label: 'Architecture', href: '/platform#map', description: 'The platform map, tier by tier' },
      { label: 'The Wall', href: '/platform#wall', description: 'The kernel boundary, ADR-006' },
      { label: 'Code Detachment', href: '/pricing#detachment', description: 'Detach to own' },
    ],
  },
  { id: 'capabilities', label: 'Capabilities', href: '/capabilities' },
  {
    id: 'skus',
    label: 'SKUs',
    href: '/skus',
    children: [
      { label: 'All SKUs', href: '/skus', description: 'Gateway and Service Boundary families' },
      { label: 'API Gateway', href: '/skus/api-gateway', description: 'Gateway family' },
      { label: 'IDP', href: '/skus/idp', description: 'Intelligent Document Processing' },
      { label: 'Bot Blocker', href: '/skus/bot-blocker', description: 'Closed-source exception' },
    ],
  },
  { id: 'ai', label: 'AI', href: '/ai' },
  { id: 'spring', label: 'Spring Runtime', href: '/spring' },
  { id: 'docs', label: 'Docs', href: '/docs' },
  { id: 'lab', label: 'Lab', href: '/lab' },
  { id: 'pricing', label: 'Pricing', href: '/pricing' },
];

export interface FooterColumn {
  readonly title: string;
  readonly links: readonly NavLink[];
}

export const FOOTER_TAGLINE = 'European open-core JVM platform. Systems by contract. Compute without waste.';

export const FOOTER_COLUMNS: readonly FooterColumn[] = [
  {
    title: 'Platform',
    links: [
      { label: 'Kernel', href: LINKS.kernel },
      { label: 'SDK', href: LINKS.sdk },
      { label: 'Tooling', href: LINKS.tooling },
      { label: 'Studio', href: '/platform#tier-1' },
      { label: 'Spring Runtime', href: '/spring' },
    ],
  },
  {
    title: 'Evidence',
    links: [
      { label: 'Lab', href: '/lab' },
      { label: 'Benchmarks repo', href: LINKS.benchmarks },
      { label: 'Claims register', href: LINKS.claims },
    ],
  },
  {
    title: 'Docs',
    links: [
      { label: 'Whitepaper', href: LINKS.whitepaper },
      { label: 'Architecture', href: LINKS.hla },
      { label: 'ADR Index', href: LINKS.adrIndex },
    ],
  },
  {
    title: 'Project',
    links: [
      { label: 'GitHub', href: LINKS.github },
      { label: 'Roadmap', href: LINKS.roadmap },
      { label: 'Blog', href: LINKS.blog },
      { label: 'Contact', href: '/pricing#contact' },
    ],
  },
];

export const FOOTER_LEGAL = ['© 2026 Exeris Systems', 'Gdynia, Poland', 'Apache-2.0 (kernel)', 'Commercial (Enterprise)'];
