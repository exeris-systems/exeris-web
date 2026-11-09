import { type ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideClientHydration, withNoIncrementalHydration } from '@angular/platform-browser';
import { TitleStrategy, provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { SHELL_CONFIG, type SearchEntry, type ShellConfig } from '@exeris-web/shell';
import buildMeta from '../../../../src/data/build-meta.json';
import { FOOTER_LEGAL, FOOTER_TAGLINE, LINKS } from '../../../../src/content/site';
import { routes } from './app.routes';
import { NAV_SECTIONS, PAGES } from './docs';
import { DocsTitleStrategy } from './seo';

const SITE = 'https://exeris.eu';

const SEARCH: readonly SearchEntry[] = PAGES.map((p) => ({
  kind: 'doc',
  title: p.title,
  href: `/${p.route}`,
  hint: NAV_SECTIONS.find((s) => s.id === p.section)?.label,
  keywords: `${p.description} ${p.keywords}`,
}));

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
    columns: NAV_SECTIONS.map((s) => ({ title: s.label, links: s.pages.slice(0, 4).map((p) => ({ label: p.title, href: `/${p.route}` })) })).slice(0, 3),
    legal: FOOTER_LEGAL,
  },
  build: { kernel: buildMeta.kernel, siteSha: null },
  searchIndex: SEARCH,
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
