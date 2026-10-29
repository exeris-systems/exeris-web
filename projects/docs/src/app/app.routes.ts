import type { Routes } from '@angular/router';
import { DOC_ROUTES } from './generated/routes';
import { HomePageComponent } from './home.page';
import { NotFoundPageComponent } from './not-found.page';

/** The section list, one route per published document, and the not-found page. */
export const routes: Routes = [
  { path: '', component: HomePageComponent },
  ...DOC_ROUTES,
  { path: '404', component: NotFoundPageComponent },
  { path: '**', component: NotFoundPageComponent },
];
