import { type ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { TitleStrategy, provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { BLOCKS } from './blocks';
import { SeoTitleStrategy } from './seo/seo-title.strategy';
import { BLOCK_REGISTRY } from './view/block-registry';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),
    provideClientHydration(),
    { provide: TitleStrategy, useClass: SeoTitleStrategy },
    { provide: BLOCK_REGISTRY, useValue: BLOCKS },
  ],
};
