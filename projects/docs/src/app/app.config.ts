import { type ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideClientHydration, withNoIncrementalHydration } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { SHELL_CONFIG, type ShellConfig } from '@exeris-web/shell';
import buildMeta from '../../../../src/data/build-meta.json';
import { routes } from './app.routes';

const SHELL: ShellConfig = {
  nav: [
    { id: 'site', label: 'Exeris', href: 'https://exeris.eu' },
    { id: 'docs', label: 'Docs', href: 'https://docs.exeris.eu' },
    { id: 'lab', label: 'Lab', href: 'https://lab.exeris.eu' },
  ],
  github: 'https://github.com/exeris-systems',
  footer: { tagline: 'Intent in. Systems out.', columns: [], legal: ['© 2026 Exeris Systems', 'Gdynia, Poland'] },
  build: { kernel: buildMeta.kernel, siteSha: null },
  searchIndex: [],
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })),
    provideClientHydration(withNoIncrementalHydration()),
    { provide: SHELL_CONFIG, useValue: SHELL },
  ],
};
