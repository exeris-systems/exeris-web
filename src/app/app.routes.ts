import type { Routes } from '@angular/router';
import { NotFoundPageComponent } from './generated/src/app/pages/not-found.component';
import { notFoundRoutes } from './generated/src/app/pages/not-found.route';
import { ViewHostComponent } from './view/view-host.component';
import { RENDERED_VIEWS, routePath } from './view/views';

/**
 * One route per authored view, rendered from its IR document, plus the generated pages and the
 * not-found fallback (the generated not-found page).
 */
export const routes: Routes = [
  ...RENDERED_VIEWS.map((view) => ({
    path: routePath(view),
    pathMatch: 'full' as const,
    component: ViewHostComponent,
    data: { view },
  })),
  ...notFoundRoutes.map((r) => ({ ...r, data: { viewName: 'not-found' } })),
  { path: '**', component: NotFoundPageComponent, data: { viewName: 'not-found' } },
];
