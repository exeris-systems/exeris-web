import type { Routes } from '@angular/router';
import { NotFoundPageComponent } from './generated/src/app/pages/not-found.component';
import { notFoundRoutes } from './generated/src/app/pages/not-found.route';

/** The generated pages and the not-found fallback (the generated not-found page). */
export const routes: Routes = [
  ...notFoundRoutes.map((r) => ({ ...r, data: { viewName: 'not-found' } })),
  { path: '**', component: NotFoundPageComponent, data: { viewName: 'not-found' } },
];
