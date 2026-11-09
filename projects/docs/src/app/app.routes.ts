import type { Routes } from '@angular/router';
import { NAV_SECTIONS, sectionRoute } from './docs';
import { DOC_ROUTES } from './generated/routes';
import { HomePageComponent } from './home.page';
import { NotFoundPageComponent } from './not-found.page';
import { SectionPageComponent } from './section.page';

/** The home page, one route per published document, a page list per section, the not-found page. */
export const routes: Routes = [
  { path: '', component: HomePageComponent },
  ...DOC_ROUTES,
  ...NAV_SECTIONS.map((s) => ({ path: sectionRoute(s).slice(1), component: SectionPageComponent, data: { section: s.id } })),
  { path: '404', component: NotFoundPageComponent },
  { path: '**', component: NotFoundPageComponent },
];
