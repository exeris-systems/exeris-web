import { DOCS_INDEX } from './generated/index';
import type { DocPage } from './doc-types';

export const SITE_URL = 'https://docs.exeris.eu';
export const SITE_NAME = 'Exeris Docs';

export const PAGES = DOCS_INDEX.pages;

export interface NavSection {
  readonly id: string;
  readonly group: string;
  readonly label: string;
  readonly pages: readonly DocPage[];
}

export interface NavGroup {
  readonly id: string;
  readonly label: string;
  readonly sections: readonly NavSection[];
}

/** The sections in their configured order, each with its pages; an empty section is left out. */
export const NAV_SECTIONS: readonly NavSection[] = DOCS_INDEX.sections
  .map((s) => ({ ...s, pages: PAGES.filter((p) => p.section === s.id) }))
  .filter((s) => s.pages.length > 0);

/** The groups (a product, or the records) in their configured order, each with its sections. */
export const NAV_GROUPS: readonly NavGroup[] = DOCS_INDEX.groups
  .map((g) => ({ ...g, sections: NAV_SECTIONS.filter((s) => s.group === g.id) }))
  .filter((g) => g.sections.length > 0);

export function pageById(id: string): DocPage {
  const page = PAGES.find((p) => p.id === id);
  if (!page) throw new Error(`no generated docs page "${id}"`);
  return page;
}

export function sectionOf(page: DocPage): NavSection {
  return NAV_SECTIONS.find((s) => s.id === page.section)!;
}

export function groupOf(section: NavSection): NavGroup {
  return NAV_GROUPS.find((g) => g.id === section.group)!;
}

export function sectionById(id: string): NavSection | undefined {
  return NAV_SECTIONS.find((s) => s.id === id);
}

/** The label a page has in the navigation. */
export function navTitle(page: DocPage): string {
  return page.navTitle ?? page.title;
}

/** The route of a section's page list. */
export function sectionRoute(section: NavSection): string {
  return `/browse/${section.id}`;
}

/** The page before and after one, in the order of its group: Overview, Guides, Modules and so on. */
export function neighbours(page: DocPage): { prev: DocPage | null; next: DocPage | null } {
  const pages = groupOf(sectionOf(page)).sections.flatMap((s) => s.pages);
  const i = pages.findIndex((p) => p.id === page.id);
  return { prev: pages[i - 1] ?? null, next: pages[i + 1] ?? null };
}

/** The file a page was rendered from, on GitHub at the ref it was read at. */
export function sourceUrl({ source }: DocPage): string {
  return `https://github.com/exeris-systems/${source.repo}/blob/${source.ref}/${source.path}`;
}

/** The release or commit each source was read at, for the footer. */
export const SOURCE_REFS = DOCS_INDEX.refs;
