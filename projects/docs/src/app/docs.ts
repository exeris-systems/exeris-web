import { DOCS_INDEX } from './generated/index';
import type { DocPage } from './doc-types';

export const SITE_URL = 'https://docs.exeris.eu';
export const SITE_NAME = 'Exeris Docs';

export const PAGES = DOCS_INDEX.pages;

/** The sections in their configured order, each with its pages; an empty section is left out. */
export const NAV_SECTIONS = DOCS_INDEX.sections
  .map((s) => ({ ...s, pages: PAGES.filter((p) => p.section === s.id) }))
  .filter((s) => s.pages.length > 0);

export function pageById(id: string): DocPage {
  const page = PAGES.find((p) => p.id === id);
  if (!page) throw new Error(`no generated docs page "${id}"`);
  return page;
}

/** The release or commit each source was read at, for the footer. */
export const SOURCE_REFS = DOCS_INDEX.refs;
