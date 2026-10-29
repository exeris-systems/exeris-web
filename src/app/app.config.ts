import { type ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideClientHydration, withNoIncrementalHydration } from '@angular/platform-browser';
import { TitleStrategy, provideRouter, withComponentInputBinding, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { SHELL_CONFIG, type SearchEntry, type ShellConfig } from '@exeris-web/shell';
import { FOOTER_COLUMNS, FOOTER_LEGAL, FOOTER_TAGLINE, LINKS, NAV } from '../content/site';
import searchIndexJson from '../data/search-index.json';
import { routes } from './app.routes';
import { BUILD_META, SITE_SHA } from './data/data';
import { SeoTitleStrategy } from './seo/seo-title.strategy';

const SHELL: ShellConfig = {
  nav: NAV,
  github: LINKS.github,
  footer: { tagline: FOOTER_TAGLINE, columns: FOOTER_COLUMNS, legal: FOOTER_LEGAL },
  build: { kernel: BUILD_META.kernel, siteSha: SITE_SHA },
  searchIndex: searchIndexJson as readonly SearchEntry[],
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
      // A navigation between pages cross-fades the content; the navigation bar stays in place
      // (shell.css). A browser without the View Transitions API navigates as before.
      withViewTransitions({ skipInitialTransition: true }),
    ),
    provideClientHydration(withNoIncrementalHydration()),
    { provide: TitleStrategy, useClass: SeoTitleStrategy },
    { provide: SHELL_CONFIG, useValue: SHELL },
  ],
};
