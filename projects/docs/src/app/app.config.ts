import { type ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideClientHydration, withNoIncrementalHydration } from '@angular/platform-browser';
import { TitleStrategy, provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { SHELL_CONFIG, type ShellConfig } from '@exeris-web/shell';
import buildMeta from '../../../../src/data/build-meta.json';
import { FOOTER_LEGAL, FOOTER_TAGLINE, LINKS } from '../../../../src/content/site';
import { routes } from './app.routes';
import { NAV_GROUPS, sectionRoute } from './docs';
import { fullText } from './search';
import { DocsTitleStrategy } from './seo';

const SITE = 'https://exeris.eu';


const SHELL: ShellConfig = {
  nav: [
    { id: 'docs', label: 'Docs', href: '/' },
    { id: 'start', label: 'Get started', href: `${SITE}/start` },
    { id: 'platform', label: 'Platform', href: `${SITE}/platform` },
    { id: 'lab', label: 'Lab', href: `${SITE}/lab` },
    { id: 'site', label: 'exeris.eu', href: SITE },
  ],
  github: LINKS.github,
  footer: {
    tagline: FOOTER_TAGLINE,
    // The first three products, each with its sections' page lists.
    columns: NAV_GROUPS.slice(0, 3).map((g) => ({ title: g.label, links: g.sections.map((s) => ({ label: s.label, href: sectionRoute(s) })) })),
    legal: FOOTER_LEGAL,
  },
  build: { kernel: buildMeta.kernel, siteSha: null },
  // The palette searches the full text of every page (search.ts), titles and headings weighted
  // above the prose; it keeps no index of its own.
  searchIndex: [],
  searchPlaceholder: 'Search the documentation…',
  fullText,
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
      // As on exeris.eu: a navigation cross-fades the page and the navigation bar stays in place.
      withViewTransitions({ skipInitialTransition: true }),
    ),
    provideClientHydration(withNoIncrementalHydration()),
    { provide: TitleStrategy, useClass: DocsTitleStrategy },
    { provide: SHELL_CONFIG, useValue: SHELL },
  ],
};
